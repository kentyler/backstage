/**
 * Create a new group conversation upload vector record
 * @module db/grpConUploadVectors/createGrpConUploadVector
 */

/**
 * Create a new group conversation upload vector record
 * @param {Object} vectorData - The vector data
 * @param {number} vectorData.uploadId - The upload ID
 * @param {number} vectorData.chunkIndex - The chunk index
 * @param {string} vectorData.contentText - The text content of the chunk
 * @param {Array<number>} [vectorData.contentVector] - The vector representation of the content (optional)
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<Object>} - The created vector record
 */
const createGrpConUploadVector = async (vectorData, pool) => {
 
  const {
    uploadId,
    chunkIndex,
    contentText,
    contentVector
  } = vectorData;
  
  const query = `
    INSERT INTO grp_con_upload_vectors (
      upload_id,
      chunk_index,
      content_text,
      content_vector
    ) VALUES (
      $1, $2, $3, $4
    ) RETURNING *
  `;
  
  // Format the vector data correctly for PostgreSQL
  // PostgreSQL expects vectors to be formatted as a string starting with "["
  let formattedVector = null;
  if (contentVector && Array.isArray(contentVector)) {
    // Convert the array to a string in the format that PostgreSQL expects
    formattedVector = `[${contentVector.join(',')}]`;
  }
  
  const values = [
    uploadId,
    chunkIndex,
    contentText,
    formattedVector
  ];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating group conversation upload vector:', error);
    throw error;
  }
};

export default createGrpConUploadVector;