/**
 * File Processing Service
 * 
 * Handles file uploads, content extraction, chunking, and vectorization.
 * Works with schema-aware file storage to support multi-tenant applications.
 */

import { createReadStream } from 'fs';
import { extname } from 'path';
import { fileTypeFromFile } from 'file-type';
import { parse as parseCsv } from 'csv-parse/sync';
import { createFileUpload, getFileUploadById } from '../db/fileUploads/index.js';
import { createFileUploadVector } from '../db/fileUploadVectors/index.js';
import { generateEmbedding } from './embeddings.js';
import { createPool } from '../db/connection.js';
import { getDefaultSchema } from '../config/schema.js';

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

  try {
    // 1. Detect file type if needed
    const detectedType = await fileTypeFromFile(fileData.path);
    const mimeType = detectedType?.mime || fileData.mimetype;
    
    // 2. Upload to storage service (Supabase or similar)
    const storageFilePath = `uploads/${schemaName}/${Date.now()}-${fileData.originalname}`;
    const publicUrl = await uploadToStorage(fileData.path, storageFilePath, schemaName);
    
    // 3. Create file upload record in database
    const fileUpload = await createFileUpload({
      filename: fileData.originalname,
      mimeType,
      filePath: storageFilePath,
      fileSize: fileData.size,
      publicUrl,
      bucketName: schemaName,
      description,
      tags
    }, pool);
    
    // 4. Extract and process text content if applicable (and not skipped)
    if (!skipVectorization) {
      await extractAndVectorizeContent(fileData.path, fileUpload.id, mimeType, pool);
    }
    
    return fileUpload;
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error(`Failed to process file: ${error.message}`);
  }
}

/**
 * Upload a file to storage (Supabase or similar)
 * 
 * @param {string} filePath - Path to the file on disk
 * @param {string} storagePath - Path in storage where the file should be stored
 * @param {string} bucketName - Storage bucket name
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
async function uploadToStorage(filePath, storagePath, bucketName) {
  try {
    // This is a placeholder - actual implementation would use Supabase or another storage service
    // For now, we'll just return a mock URL since we don't have the actual storage integration
    
    // In a real implementation:
    // 1. Create a read stream from the file
    // const fileStream = createReadStream(filePath);
    // 2. Upload to storage service (e.g., Supabase)
    // 3. Get and return the public URL
    
    console.log(`Mock: Uploading ${filePath} to ${bucketName}/${storagePath}`);
    
    return `https://storage.example.com/${bucketName}/${storagePath}`;
  } catch (error) {
    console.error('Error uploading to storage:', error);
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
 * @returns {Promise<void>}
 */
async function extractAndVectorizeContent(filePath, fileUploadId, mimeType, pool) {
  try {
    // 1. Extract text based on file type
    const extractedText = await extractText(filePath, mimeType);
    if (!extractedText) {
      console.log(`No text could be extracted from file ${fileUploadId}`);
      return;
    }
    
    // 2. Split text into chunks
    const chunks = chunkText(extractedText);
    console.log(`Split text into ${chunks.length} chunks for file ${fileUploadId}`);
    
    // 3. Generate embeddings and store for each chunk
    for (const [index, chunk] of chunks.entries()) {
      try {
        // Generate embedding for this chunk
        const embedding = await generateEmbedding(chunk);
        
        // Store chunk with its embedding
        await createFileUploadVector({
          fileUploadId,
          chunkIndex: index,
          contentText: chunk,
          contentVector: embedding
        }, pool);
        
        console.log(`Processed chunk ${index + 1}/${chunks.length} for file ${fileUploadId}`);
      } catch (error) {
        console.error(`Error processing chunk ${index} for file ${fileUploadId}:`, error);
        // Continue with other chunks even if one fails
      }
    }
  } catch (error) {
    console.error('Error extracting content:', error);
    throw error;
  }
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
