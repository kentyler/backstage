/**
 * Delete a file upload by ID
 * @module db/fileUploads/deleteFileUpload
 */

/**
 * Delete a file upload by ID
 * @param {number} fileUploadId - The ID of the file upload to delete
 * @param {Object} pool - The PostgreSQL connection pool
 * @returns {Promise<Object>} - The deleted file upload record or null if not found
 */
export async function deleteFileUpload(fileUploadId, pool) {
  if (!fileUploadId) {
    throw new Error('File upload ID is required');
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
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error deleting file upload:', error);
    throw error;
  }
}
