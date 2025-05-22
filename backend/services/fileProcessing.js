/**
 * File Processing Service
 * 
 * Handles file uploads, content extraction, chunking, and vectorization.
 * Works with schema-aware file storage to support multi-tenant applications.
 */

import { createReadStream, readFileSync } from 'fs';
import * as fs from 'fs';
import { extname } from 'path';
import { fileTypeFromFile } from 'file-type';
import { parse as parseCsv } from 'csv-parse/sync';
import { createFileUpload, getFileUploadById } from '../db/fileUploads/index.js';
import { createFileUploadVector } from '../db/fileUploadVectors/index.js';
import { generateEmbedding } from './embeddings.js';
import { createPool } from '../db/connection.js';
import { getDefaultSchema } from '../config/schema.js';
import { createClient } from '@supabase/supabase-js';
import { Transform, Readable } from 'stream';
import { promisify } from 'util';
import { pipeline } from 'stream/promises';

// Track which files are currently being processed to prevent deletion
const filesInProcessing = new Map(); // fileId -> timestamp

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

// Maximum size for each text chunk (in characters)
const MAX_CHUNK_SIZE = 1000;

// Overlap between chunks (in characters) to preserve context
const CHUNK_OVERLAP = 100;

/**
 * Process a file and store it in the database
 * 
 * @param {Object} fileData - The file data object
 * @param {string} fileData.path - Temporary file path on disk
 * @param {string} fileData.originalname - Original file name
 * @param {string} fileData.mimetype - File MIME type
 * @param {number} fileData.size - File size in bytes
 * @param {Object} options - Processing options
 * @param {string} [options.schemaName] - Schema name (defaults to current schema)
 * @param {string} [options.description] - Optional file description
 * @param {string[]} [options.tags] - Optional tags for categorization
 * @param {boolean} [options.skipVectorization] - Skip the vectorization step
 * @param {Object} pool - The PostgreSQL connection pool
 * @returns {Promise<Object>} - The processed file record
 */
export async function processFile(fileData, options = {}, pool) {
  const {
    schemaName = getDefaultSchema(),
    description = null,
    tags = null,
    skipVectorization = false
  } = options;

  // Client for database operations
  let client = null;
  let fileUpload = null;

  try {
    // 1. Detect file type if needed
    const detectedType = await fileTypeFromFile(fileData.path);
    const mimeType = detectedType?.mime || fileData.mimetype;
    const fileSize = fileData.size;
    
    // 2. Generate a storage path and unique filename
    const timestamp = Date.now();
    const originalName = fileData.originalname.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const filename = `${timestamp}-${originalName}`;
    const storagePath = `uploads/${filename}`;
    
    // Use the schema name as the bucket name for proper multi-tenant separation
    const bucketName = schemaName;
    
    console.log(`Using bucket '${bucketName}' for file storage based on schema`);
    
    // 3. Upload to storage
    const publicUrl = await uploadToStorage(fileData.path, storagePath, bucketName);
    console.log(`File uploaded to storage at: ${publicUrl}`);
    
    // 4. Create file upload record in database as a transaction
    client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query(`SET search_path TO ${schemaName}, public;`);
      
      const result = await client.query(
        `INSERT INTO file_uploads (
          filename, mime_type, file_size, 
          file_path, public_url, description, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          fileData.originalname, // Using originalname from the upload as the filename 
          mimeType,
          fileSize,
          storagePath,
          publicUrl,
          description,
          tags
        ]
      );
      
      fileUpload = result.rows[0];
      console.log(`File upload record created with ID: ${fileUpload.id} in schema: ${schemaName}`);
      
      await client.query('COMMIT');
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
    
    // 5. Start content extraction and vectorization in the background (if not skipped)
    if (!skipVectorization && fileUpload) {
      console.log(`Setting up background processing for file ${fileUpload.id}`);
      
      // Small delay to ensure transaction completes fully
      setTimeout(() => {
        // Create a function to verify file existence and process content
        const processFileContent = async () => {
          try {
            console.log(`Starting background processing for file ${fileUpload.id}`);
            await extractAndVectorizeContent(
              fileData.path, 
              fileUpload.id, 
              mimeType, 
              pool, 
              schemaName
            );
          } catch (error) {
            console.error(`Error in background processing for file ${fileUpload.id}:`, error);
          }
        };
        
        // Start the processing
        processFileContent();
      }, 1000);
    }
    
    return fileUpload;
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error(`Failed to process file: ${error.message}`);
  }
}

/**
 * Upload a file to storage (Supabase)
 * 
 * @param {string} filePath - Path to the file on disk
 * @param {string} storagePath - Path in storage where the file should be stored
 * @param {string} bucketName - Storage bucket name (defaults to schema name)
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
async function uploadToStorage(filePath, storagePath, bucketName) {
  try {
    // Initialize Supabase client
    console.log('Initializing Supabase client...');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Check environment variables.');
    }
    
    console.log('Creating Supabase client with URL:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if bucket exists
    console.log(`Checking if bucket '${bucketName}' exists in Supabase storage...`);
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      throw new Error(`Failed to check storage buckets: ${bucketsError.message}`);
    }
    
    const bucketExists = buckets.some(b => b.name === bucketName);
    if (!bucketExists) {
      console.error(`Bucket '${bucketName}' does not exist. Available buckets:`, buckets.map(b => b.name));
      throw new Error(`Storage bucket '${bucketName}' does not exist`);
    }
    
    // Read file contents
    console.log(`Reading file from: ${filePath}`);
    const fileBuffer = readFileSync(filePath);
    console.log(`File read successfully, size: ${fileBuffer.length} bytes`);
    
    console.log(`Uploading ${filePath} to Supabase storage: ${bucketName}/${storagePath}`);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: 'application/octet-stream', // Let Supabase detect the content type
        upsert: true // Overwrite if file exists
      });
      
    if (error) {
      console.error('Supabase storage upload error:', error);
      throw error;
    }
    
    console.log('File successfully uploaded to storage');
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);
      
    console.log('File uploaded successfully to Supabase storage');
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading to Supabase storage:', error);
    throw error;
  }
}

/**
 * Delete a file from Supabase storage
 * 
 * @param {string} storagePath - Path to the file in storage (e.g., 'uploads/filename.txt')
 * @param {string} [bucketName='uploads'] - Name of the storage bucket
 * @returns {Promise<boolean>} - True if deletion was successful
 */
async function deleteFromStorage(storagePath, bucketName = 'uploads') {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Check environment variables.');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Remove leading slash if present
    const cleanPath = storagePath.startsWith('/') ? storagePath.substring(1) : storagePath;
    
    console.log(`Deleting file from storage: ${bucketName}/${cleanPath}`);
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([cleanPath]);
      
    if (error) {
      // If file not found, consider it a success
      if (error.message.includes('not found')) {
        console.log(`File ${cleanPath} not found in storage, considering it deleted`);
        return true;
      }
      throw error;
    }
    
    console.log(`Successfully deleted file from storage: ${cleanPath}`);
    return true;
  } catch (error) {
    console.error('Error deleting file from storage:', error);
    throw error;
  }
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
async function extractAndVectorizeContent(filePath, fileUploadId, mimeType, pool, schemaName = 'public') {
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
      const text = await extractFromPdf(filePath);
      return Readable.from([text]);
    } else if (mimeType.includes('spreadsheetml') || mimeType.includes('excel') || 
              mimeType.includes('csv') || extname(filePath) === '.csv') {
      // CSV processing
      console.log('CSV streaming not yet supported - falling back to full extraction');
      const text = await extractFromCsv(filePath);
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
 * @returns {Transform} A transform stream that processes chunks
 */
function createVectorizerStream(fileUploadId, pool, schemaName = 'public') {
  // Keep track of active promises to avoid memory issues
  let activePromises = 0;
  const MAX_CONCURRENT = 3; // Only process 3 chunks at a time
  const queue = [];
  
  // First check if the file still exists in the database
  let fileExists = false;
  
  const verifyFileExists = async () => {
    try {
      // Direct query to ensure we're checking the exact same schema and connection
      // This is more reliable than using the imported function
      const client = await pool.connect();
      try {
        // Use the explicitly provided schema name
        const schema = client.escapeIdentifier ? 
          client.escapeIdentifier(schemaName) : 
          `"${schemaName}"`;
          
        await client.query(`SET search_path TO ${schema}, public;`);
        
        // Direct query to check file existence
        const result = await client.query(
          'SELECT id FROM file_uploads WHERE id = $1',
          [fileUploadId]
        );
        
        fileExists = result.rowCount > 0;
        
        if (!fileExists) {
          console.error(`File ${fileUploadId} no longer exists in database (direct query), aborting vectorization`);
        } else {
          console.log(`Verified file ${fileUploadId} exists in database (direct query), proceeding with vectorization`);
          // Log the schema being used
          console.log(`Using schema: ${pool._schema || 'public'} for file ${fileUploadId} verification`);
        }
        
        return fileExists;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error verifying file ${fileUploadId} existence:`, error);
      return false;
    }
  };
  
  const processQueue = async (stream) => {
    // If we haven't checked file existence yet, do it now
    if (fileExists === false) {
      const exists = await verifyFileExists();
      if (!exists) return; // Stop processing if file doesn't exist
    }
    
    // While we have capacity and items in the queue
    while (activePromises < MAX_CONCURRENT && queue.length > 0) {
      const chunk = queue.shift();
      activePromises++;
      
      try {
        console.log(`Vectorizing chunk ${chunk.index + 1} for file ${fileUploadId}`);
        
        // Generate embedding
        const embedding = await generateEmbedding(chunk.text);
        
        // Double-check file still exists before inserting vector
        const stillExists = await verifyFileExists();
        if (!stillExists) {
          console.log(`File ${fileUploadId} was deleted during processing, skipping vector creation`);
          return; // Exit early
        }
        
        // Store in database
        await createFileUploadVector({
          fileUploadId,
          chunkIndex: chunk.index,
          contentText: chunk.text,
          contentVector: embedding
        }, pool);
        
        console.log(`Completed processing chunk ${chunk.index + 1} for file ${fileUploadId}`);
      } catch (error) {
        console.error(`Error vectorizing chunk ${chunk.index}:`, error);
      } finally {
        activePromises--;
        // Process more items if available
        if (queue.length > 0 && fileExists) {
          processQueue(stream);
        }
      }
    }
  };
  
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      // Add the chunk to our processing queue
      queue.push(chunk);
      
      // Start processing if we have capacity
      if (activePromises < MAX_CONCURRENT) {
        processQueue(this);
      }
      
      callback();
    },
    flush(callback) {
      // Return a promise that resolves when all chunks are processed
      const checkComplete = () => {
        if (activePromises === 0 && queue.length === 0) {
          callback();
        } else {
          setTimeout(checkComplete, 100);
        }
      };
      
      checkComplete();
    }
  });
}

/**
 * Extract text content from a file based on its MIME type
 * 
 * @param {string} filePath - Path to the file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string|null>} - Extracted text or null if extraction failed
 */
async function extractText(filePath, mimeType) {
  try {
    // Handle different file types
    if (mimeType.startsWith('text/')) {
      // Text files: TXT, HTML, etc.
      return extractFromTextFile(filePath);
    } else if (mimeType === 'application/pdf') {
      // PDF files
      return extractFromPdf(filePath);
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // DOCX files
      return extractFromDocx(filePath);
    } else if (mimeType === 'application/csv' || mimeType === 'text/csv') {
      // CSV files
      return extractFromCsv(filePath);
    } else if (mimeType === 'application/json') {
      // JSON files
      return extractFromJson(filePath);
    } else {
      console.log(`Unsupported file type for text extraction: ${mimeType}`);
      return null;
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    return null;
  }
}

/**
 * Extract text from a plain text file
 * 
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromTextFile(filePath) {
  const fs = await import('fs/promises');
  return fs.readFile(filePath, 'utf8');
}

/**
 * Extract text from a PDF file
 * 
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromPdf(filePath) {
  try {
    // This is a placeholder - in a real implementation, you would use a PDF parsing library
    // For example, using pdf-parse:
    // const pdf = require('pdf-parse');
    // const dataBuffer = fs.readFileSync(filePath);
    // const data = await pdf(dataBuffer);
    // return data.text;
    
    // For now, return a placeholder message
    console.log(`Mock: Extracting text from PDF ${filePath}`);
    return "This is placeholder text extracted from a PDF file.";
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return null;
  }
}

/**
 * Extract text from a DOCX file
 * 
 * @param {string} filePath - Path to the DOCX file
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromDocx(filePath) {
  try {
    // This is a placeholder - in a real implementation, you would use a DOCX parsing library
    // For example, using mammoth:
    // const mammoth = require('mammoth');
    // const result = await mammoth.extractRawText({path: filePath});
    // return result.value;
    
    // For now, return a placeholder message
    console.log(`Mock: Extracting text from DOCX ${filePath}`);
    return "This is placeholder text extracted from a DOCX file.";
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    return null;
  }
}

/**
 * Extract text from a CSV file
 * 
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromCsv(filePath) {
  try {
    const fs = await import('fs/promises');
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    // Parse CSV
    const records = parseCsv(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    // Convert to text format
    let result = '';
    for (const record of records) {
      // Build a text representation of each row
      const row = Object.entries(record)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      result += row + '\n';
    }
    
    return result;
  } catch (error) {
    console.error('Error extracting text from CSV:', error);
    return null;
  }
}

/**
 * Extract text from a JSON file
 * 
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromJson(filePath) {
  try {
    const fs = await import('fs/promises');
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    // Parse JSON and convert to formatted string
    const data = JSON.parse(fileContent);
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Error extracting text from JSON:', error);
    return null;
  }
}

/**
 * Split text into chunks with overlap
 * 
 * @param {string} text - Text to chunk
 * @returns {string[]} - Array of text chunks
 */
function chunkText(text) {
  if (!text) return [];
  
  const chunks = [];
  let currentPosition = 0;
  
  while (currentPosition < text.length) {
    // Calculate end position for this chunk
    const endPosition = Math.min(
      currentPosition + MAX_CHUNK_SIZE,
      text.length
    );
    
    // Extract chunk
    const chunk = text.substring(currentPosition, endPosition);
    chunks.push(chunk);
    
    // Move position forward, accounting for overlap
    currentPosition = endPosition - CHUNK_OVERLAP;
    
    // Ensure we make progress even with small texts
    if (currentPosition <= 0) {
      currentPosition = endPosition;
    }
  }
  
  return chunks;
}

/**
 * Search within file content using semantic similarity
 * 
 * @param {string} query - The search query
 * @param {Object} options - Search options
 * @param {string} [options.schemaName] - Schema name to search within
 * @param {number} [options.limit=5] - Maximum number of results to return
 * @param {number} [options.threshold=0.7] - Similarity threshold (0-1)
 * @param {Object} pool - The PostgreSQL connection pool
 * @returns {Promise<Array>} - Search results
 */
export async function searchFileContent(query, options = {}, pool) {
  const {
    schemaName = getDefaultSchema(),
    limit = 5,
    threshold = 0.7
  } = options;
  
  try {
    // 1. Generate embedding for the query
    const queryVector = await generateEmbedding(query);
    
    // 2. Perform vector search
    const { searchSimilarVectors } = await import('../db/fileUploadVectors/index.js');
    const results = await searchSimilarVectors(queryVector, {
      limit,
      threshold
    }, pool);
    
    // 4. Format results
    return results.map(result => ({
      fileId: result.file_upload_id,
      fileName: result.filename,
      mimeType: result.mime_type,
      chunkIndex: result.chunk_index,
      content: result.content_text,
      url: result.public_url,
      similarity: result.similarity
    }));
  } catch (error) {
    console.error('Error searching file content:', error);
    throw error;
  }
}
