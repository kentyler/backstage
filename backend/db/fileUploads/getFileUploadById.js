/**
 * Get a file upload by ID
 * @module db/fileUploads/getFileUploadById
 */
import { createDbError, DB_ERROR_CODES } from '../utils/index.js';

/**
 * File Uploads module - retrieves file upload records by ID
 * @module db/fileUploads/getFileUploadById
 */

/**
 * Get a file upload by ID
 * @param {number} fileUploadId - The ID of the file upload
 * @param {Object} pool - The PostgreSQL connection pool
 * @returns {Promise<Object>} - The file upload record or null if not found
 */
export async function getFileUploadById(fileUploadId, pool) {
  if (!fileUploadId) {
    throw createDbError('File upload ID is required', {
      code: 'INVALID_PARAMETER',
      status: 400,
      context: { operation: 'getFileUploadById' }
    });
  }

  try {
      
    // Execute the query
    const queryText = `
      SELECT * FROM file_uploads
      WHERE id = $1
    `;
    const values = [fileUploadId];
    
    const result = await pool.query(queryText, values);
    const fileUpload = result.rows[0];
    
    // Unlike delete, we don't throw an error if not found - we return null
    // This allows callers to check for existence without try/catch
    return fileUpload;
  } catch (error) {
    console.error('Error getting file upload by ID:', {
      error: error.message,
      fileUploadId,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'getFileUploadById' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('File uploads table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { operation: 'getFileUploadById' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to retrieve file upload', {
      code: 'DB_QUERY_ERROR',
      status: 500,
      context: { fileUploadId, operation: 'getFileUploadById' },
      cause: error
    });
  }
}
