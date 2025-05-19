/**
 * Create a new file upload vector
 * @module db/fileUploadVectors/createFileUploadVector
 */

/**
 * Create a new file upload vector entry for a file chunk
 * @param {Object} vectorData - The vector data
 * @param {number} vectorData.fileUploadId - The ID of the file upload
 * @param {number} vectorData.chunkIndex - The index of the chunk
 * @param {string} vectorData.contentText - The text content of the chunk
 * @param {Array} vectorData.contentVector - The vector representation of the content
 * @param {Object} pool - The PostgreSQL connection pool
 * @returns {Promise<Object>} - The created vector record
 */
export async function createFileUploadVector(vectorData, pool) {
  const {
    fileUploadId,
    chunkIndex,
    contentText,
    contentVector
  } = vectorData;
  
  // Validate required fields
  if (!fileUploadId) throw new Error('File upload ID is required');
  if (chunkIndex === undefined || chunkIndex === null) throw new Error('Chunk index is required');
  if (!contentText) throw new Error('Content text is required');
  if (!contentVector || !Array.isArray(contentVector)) throw new Error('Content vector must be an array');
  
  try {

    // Convert vector to string representation if needed
    const vectorValue = typeof contentVector === 'string' 
      ? contentVector 
      : JSON.stringify(contentVector);
    
    // Execute the query
    const queryText = `
      INSERT INTO file_upload_vectors 
      (file_upload_id, chunk_index, content_text, content_vector) 
      VALUES ($1, $2, $3, $4::vector) 
      ON CONFLICT (file_upload_id, chunk_index) DO UPDATE
      SET content_text = EXCLUDED.content_text, 
          content_vector = EXCLUDED.content_vector
      RETURNING *
    `;
    const values = [
      fileUploadId,
      chunkIndex,
      contentText,
      vectorValue
    ];
    
    const result = await pool.query(queryText, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating file upload vector:', error);
    throw error;
  }
}
