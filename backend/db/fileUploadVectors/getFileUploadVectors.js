/**
 * Get vectors for a file upload
 * @module db/fileUploadVectors/getFileUploadVectors
 */

/**
 * Get all vector entries for a file upload
 * @param {number} fileUploadId - The ID of the file upload
 * @param {Object} pool - The PostgreSQL connection pool
 * @returns {Promise<Array>} - Array of vector entries
 */
export async function getFileUploadVectors(fileUploadId, pool) {
  if (!fileUploadId) {
    throw new Error('File upload ID is required');
  }

  try {
    
    // Execute the query
    const queryText = `
      SELECT * FROM file_upload_vectors
      WHERE file_upload_id = $1
      ORDER BY chunk_index
    `;
    const values = [fileUploadId];
    
    const result = await pool.query(queryText, values);
    return result.rows;
  } catch (error) {
    console.error('Error getting file upload vectors:', error);
    throw error;
  }
}
