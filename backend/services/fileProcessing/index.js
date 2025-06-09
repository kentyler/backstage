/**
 * File Processing Service - Main Entry Point
 * 
 * Handles file uploads, content extraction, chunking, and vectorization.
 * Works with schema-aware file storage to support multi-tenant applications.
 * 
 * This module orchestrates the various file processing operations by
 * delegating to specialized modules for storage, extraction, vectorization,
 * and search functionality.
 */

import { fileTypeFromFile } from 'file-type';
import { createFileUpload } from '../../db/fileUploads/index.js';
import { getDefaultSchema } from '../../config/schema.js';
import { uploadToStorage, deleteFromStorage } from './storage.js';
import { extractAndVectorizeContent, isFileInProcessing } from './vectorization.js';
import { searchFileContent } from './search.js';

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

// Re-export functions from other modules for backward compatibility
export { deleteFromStorage } from './storage.js';
export { searchFileContent } from './search.js';
export { isFileInProcessing } from './vectorization.js';