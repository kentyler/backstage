/**
 * Get a file upload by ID
 * @module db/fileUploads/getFileUploadById
 */

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
    throw new Error('File upload ID is required');
  }

  try {
      
    // Execute the query
    const queryText = `
      SELECT * FROM file_uploads
      WHERE id = $1
    `;
    const values = [fileUploadId];
    
    const result = await pool.query(queryText, values);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting file upload by ID:', error);
    throw error;
  }
}
