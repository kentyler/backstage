/**
 * Vectorization Pipeline Service
 * 
 * Handles streaming text processing, chunking, and vector generation
 * for file content. Uses a pipeline approach to process large files
 * efficiently without loading everything into memory.
 */

import { createReadStream } from 'fs';
import { Transform, Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { extname } from 'path';
import { generateEmbedding } from '../embeddings.js';
import { createFileUploadVector } from '../../db/fileUploadVectors/index.js';
import { extractText } from './extraction.js';

// Track which files are currently being processed to prevent deletion
const filesInProcessing = new Map(); // fileId -> timestamp

// Maximum size for each text chunk (in characters)
const MAX_CHUNK_SIZE = 1000;

// Overlap between chunks (in characters) to preserve context
const CHUNK_OVERLAP = 100;

/**
 * Check if a file is currently being processed
 * @param {number} fileId - The ID of the file to check
 * @returns {boolean} - True if the file is being processed
 */
export function isFileInProcessing(fileId) {
  return filesInProcessing.has(fileId);
}

/**
 * Mark a file as being processed
 * @param {number} fileId - The ID of the file to mark
 */
function markFileAsProcessing(fileId) {
  filesInProcessing.set(fileId, Date.now());
  console.log(`Marked file ${fileId} as being processed - total files in processing: ${filesInProcessing.size}`);
}

/**
 * Mark a file as no longer being processed
 * @param {number} fileId - The ID of the file to unmark
 */
function markFileAsProcessed(fileId) {
  filesInProcessing.delete(fileId);
  console.log(`Marked file ${fileId} as processed - total files in processing: ${filesInProcessing.size}`);
}

/**
 * Extract and vectorize content from a file
 * 
 * @param {string} filePath - Path to the file on disk
 * @param {number} fileUploadId - ID of the file upload record
 * @param {string} mimeType - MIME type of the file
 * @param {Object} pool - Database pool to use
 * @param {string} schemaName - Schema name to use for database operations
 * @returns {Promise<void>}
 */
export async function extractAndVectorizeContent(filePath, fileUploadId, mimeType, pool, schemaName = 'public') {
  try {
    // Mark file as being processed
    markFileAsProcessing(fileUploadId);
    
    console.log(`Starting streaming content extraction for file ${fileUploadId}`);
    
    // Create stream-based text extractor based on mime type
    const textStream = await createTextExtractionStream(filePath, mimeType);
    if (!textStream) {
      console.log(`No text extraction stream could be created for file ${fileUploadId}`);
      return;
    }
    
    // Create a chunker stream that will emit chunks of text
    const chunker = createChunkerStream(MAX_CHUNK_SIZE, CHUNK_OVERLAP);
    
    // Create a vectorizer stream that will generate embeddings and save to database
    // Pass schema name to ensure consistent database operations
    const vectorizer = createVectorizerStream(fileUploadId, pool, schemaName);
    
    console.log(`Using schema '${schemaName}' for file ${fileUploadId} vectorization`);
    
    // Set up the pipeline: textStream -> chunker -> vectorizer
    console.log(`Setting up processing pipeline for file ${fileUploadId}`);
    await pipeline(
      textStream,
      chunker,
      vectorizer
    );
    
    console.log(`Completed streaming processing for file ${fileUploadId}`);
  } catch (error) {
    console.error(`Error in streaming extraction pipeline for file ${fileUploadId}:`, error);
    throw error;
  } finally {
    // Always mark as processed even if there was an error
    markFileAsProcessed(fileUploadId);
  }
}

/**
 * Creates a readable stream that extracts text from a file
 * 
 * @param {string} filePath - Path to the file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<Readable>} A readable stream of text content
 */
async function createTextExtractionStream(filePath, mimeType) {
  console.log(`Creating text extraction stream for ${filePath} with type ${mimeType}`);
  
  try {
    // Different file types require different extraction approaches
    if (mimeType === 'text/plain' || mimeType.includes('text/')) {
      // For plain text, we can just return the file stream directly
      return createReadStream(filePath, { encoding: 'utf8' });
    } else if (mimeType === 'application/pdf' || mimeType.includes('pdf')) {
      // For PDFs, we would need a proper PDF parser that supports streaming
      // For simplicity, we'll fall back to non-streaming for PDF files
      console.log('PDF streaming not yet supported - falling back to full extraction');
      const text = await extractText(filePath, mimeType);
      return Readable.from([text]);
    } else if (mimeType.includes('spreadsheetml') || mimeType.includes('excel') || 
              mimeType.includes('csv') || extname(filePath) === '.csv') {
      // CSV processing
      console.log('CSV streaming not yet supported - falling back to full extraction');
      const text = await extractText(filePath, mimeType);
      return Readable.from([text]);
    } else {
      // For other types, fall back to full extraction
      console.log(`Streaming not yet supported for ${mimeType} - falling back to full extraction`);
      const text = await extractText(filePath, mimeType);
      return Readable.from([text || '']);
    }
  } catch (error) {
    console.error('Error creating text extraction stream:', error);
    // Return an empty stream as fallback
    return Readable.from(['']);
  }
}

/**
 * Creates a transform stream that chunks text into smaller pieces
 * 
 * @param {number} maxChunkSize - Maximum size of each chunk
 * @param {number} overlap - Overlap between chunks
 * @returns {Transform} A transform stream that outputs text chunks
 */
function createChunkerStream(maxChunkSize, overlap) {
  let buffer = '';
  let chunkIndex = 0;
  
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      // Add the new text to our buffer
      buffer += chunk.toString();
      
      // While we have enough text for a complete chunk
      while (buffer.length >= maxChunkSize) {
        // Extract a chunk
        const chunkText = buffer.slice(0, maxChunkSize);
        
        // Remove from buffer, keeping the overlap
        buffer = buffer.slice(maxChunkSize - overlap);
        
        // Send the chunk downstream
        this.push({ text: chunkText, index: chunkIndex++ });
      }
      
      callback();
    },
    flush(callback) {
      // Push any remaining text as the final chunk
      if (buffer.length > 0) {
        this.push({ text: buffer, index: chunkIndex });
      }
      callback();
    }
  });
}

/**
 * Creates a transform stream that processes chunks and saves vectors to the database
 * 
 * @param {number} fileUploadId - ID of the file upload
 * @param {Object} pool - Database connection pool
 * @param {string} schemaName - Schema name for database operations
 * @returns {Transform} A transform stream that processes chunks
 */
function createVectorizerStream(fileUploadId, pool, schemaName = 'public') {
  // Keep track of active promises to avoid memory issues
  let activePromises = 0;
  const MAX_CONCURRENT = 3; // Only process 3 chunks at a time
  const queue = [];
  
  // Track if file has been verified to exist
  let fileVerified = false;
  
  // Store schema info for consistent usage across all operations
  const effectiveSchema = pool._schema || schemaName || 'public';
  console.log(`Using schema '${effectiveSchema}' for file ${fileUploadId} vectorization`);
  
  // Verify file existence once for the entire stream
  const verifyFileExists = async () => {
    try {
      const client = await pool.connect();
      try {
        const schema = client.escapeIdentifier ? 
          client.escapeIdentifier(effectiveSchema) : 
          `"${effectiveSchema}"`;
          
        await client.query(`SET search_path TO ${schema}, public;`);
        console.log(`Set search_path to ${effectiveSchema} for file verification`);
        
        const result = await client.query(
          'SELECT id FROM file_uploads WHERE id = $1',
          [fileUploadId]
        );
        
        const exists = result.rowCount > 0;
        
        if (!exists) {
          console.error(`File ${fileUploadId} no longer exists in database (direct query), aborting vectorization`);
        } else {
          console.log(`Verified file ${fileUploadId} exists in database (direct query), proceeding with vectorization`);
        }
        
        return exists;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error verifying file ${fileUploadId} existence:`, error);
      return false;
    }
  };
  
  // Process chunks from the queue
  const processQueue = async (stream) => {
    while (activePromises < MAX_CONCURRENT && queue.length > 0) {
      const chunk = queue.shift();
      activePromises++;
      
      try {
        console.log(`Vectorizing chunk ${chunk.index} for file ${fileUploadId}`);
        
        // Generate embedding
        const embedding = await generateEmbedding(chunk.text);
        
        // Extract schema from connection options if available
        let extractedSchema = 'public';
        
        if (pool._clients && pool._clients[0] && pool._clients[0].connectionParameters) {
          const params = pool._clients[0].connectionParameters;
          if (params.search_path) {
            const parts = params.search_path.split(',');
            if (parts.length > 0) {
              extractedSchema = parts[0].trim().replace(/"/g, '');
            }
          }
        }
        
        console.log(`Using schema '${extractedSchema}' for vectorizing chunk ${chunk.index} of file ${fileUploadId}`);
        
        await createFileUploadVector({
          fileUploadId,
          chunkIndex: chunk.index,
          contentText: chunk.text,
          contentVector: embedding,
          schemaName: extractedSchema
        }, pool);
        
        console.log(`Completed processing chunk ${chunk.index} for file ${fileUploadId}`);
      } catch (error) {
        console.error(`Error vectorizing chunk ${chunk.index}:`, error);
      } finally {
        activePromises--;
        // Process more items if available
        if (queue.length > 0) {
          processQueue(stream);
        }
      }
    }
  };
  
  // Create and return the transform stream
  return new Transform({
    objectMode: true,
    async transform(chunk, encoding, callback) {
      // Only verify file existence once for the first chunk
      if (!fileVerified) {
        const exists = await verifyFileExists();
        fileVerified = true; // Mark as verified regardless of result
        
        if (!exists) {
          console.log(`File ${fileUploadId} doesn't exist, skipping all chunk processing`);
          callback();
          return;
        }
      }
      
      // Add chunk to processing queue
      queue.push(chunk);
      
      // Start processing if we have capacity
      if (activePromises < MAX_CONCURRENT) {
        processQueue(this);
      }
      
      callback();
    },
    flush(callback) {
      // Wait for all pending operations to complete
      const checkComplete = () => {
        if (activePromises === 0 && queue.length === 0) {
          console.log(`Completed streaming processing for file ${fileUploadId}`);
          callback();
        } else {
          setTimeout(checkComplete, 100);
        }
      };
      
      checkComplete();
    }
  });
}