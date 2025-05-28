/**
 * Create a new file upload record
 * @module db/fileUploads/createFileUpload
 */
import { createDbError, DB_ERROR_CODES } from '../utils/index.js';

/**
 * File Uploads module - creates file upload records
 * @module db/fileUploads/createFileUpload
 */

/**
 * Create a new file upload record
 * @param {Object} uploadData - The upload data
 * @param {string} uploadData.filename - The filename
 * @param {string} uploadData.mimeType - The MIME type
 * @param {string} uploadData.filePath - The file path in storage
 * @param {number} [uploadData.fileSize] - The file size in bytes (optional)
 * @param {string} [uploadData.publicUrl] - The public URL of the file (optional)
 * @param {string} [uploadData.description] - Optional description of the file
 * @param {string[]} [uploadData.tags] - Optional tags for categorizing the file
 * @param {Object} pool - The PostgreSQL connection pool
 * @returns {Promise<Object>} - The created upload record
 */
export async function createFileUpload(uploadData, pool) {
  const {
    filename,
    mimeType,
    filePath,
    fileSize,
    publicUrl,
    description,
    tags
  } = uploadData;
  
  // Default bucket name to 'public' if not available from pool options
  let bucketName = pool?.options?.schema || 'public';
  
  try {
      
    // Execute the query
    const queryText = `
      INSERT INTO file_uploads 
      (filename, mime_type, file_path, file_size, public_url, bucket_name, description, tags) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `;
    const values = [
      filename,
      mimeType,
      filePath,
      fileSize || null,
      publicUrl || null,
      bucketName,
      description || null,
      tags || null
    ];
    
    const result = await pool.query(queryText, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating file upload:', {
      error: error.message,
      filename,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'createFileUpload' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '23505') { // Unique violation
      throw createDbError(`File upload with path "${filePath}" already exists`, {
        code: 'DUPLICATE_FILE_UPLOAD',
        status: 409, // Conflict
        context: { filename, filePath },
        cause: error
      });
    }
    
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('File uploads table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { operation: 'createFileUpload' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to create file upload record', {
      code: 'DB_OPERATION_FAILED',
      status: 500,
      context: { filename, filePath, operation: 'createFileUpload' },
      cause: error
    });
  }
}
