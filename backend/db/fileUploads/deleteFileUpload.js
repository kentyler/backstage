/**
 * Delete a file upload by ID
 * @module db/fileUploads/deleteFileUpload
 */
import { createDbError, DB_ERROR_CODES } from '../utils/index.js';

/**
 * Delete a file upload by ID
 * @param {number} fileUploadId - The ID of the file upload to delete
 * @param {Object} pool - The PostgreSQL connection pool
 * @returns {Promise<Object>} - The deleted file upload record or null if not found
 */
export async function deleteFileUpload(fileUploadId, pool) {
  if (!fileUploadId) {
    throw createDbError('File upload ID is required', {
      code: 'INVALID_PARAMETER',
      status: 400,
      context: { fileUploadId }
    });
  }

  try {
    
    // Execute the delete query
    const queryText = `
      DELETE FROM file_uploads
      WHERE id = $1
      RETURNING *
    `;
    const values = [fileUploadId];
    
    const result = await pool.query(queryText, values);
    const deletedFile = result.rows[0];
    
    if (!deletedFile) {
      throw createDbError(`File upload with ID ${fileUploadId} not found`, {
        code: 'FILE_NOT_FOUND',
        status: 404,
        context: { fileUploadId }
      });
    }
    
    return deletedFile;
  } catch (error) {
    console.error('Error deleting file upload:', {
      error: error.message,
      fileUploadId,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'deleteFileUpload' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('File uploads table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { operation: 'deleteFileUpload' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to delete file upload', {
      code: 'DB_OPERATION_FAILED',
      status: 500,
      context: { fileUploadId, operation: 'deleteFileUpload' },
      cause: error
    });
  }
}
