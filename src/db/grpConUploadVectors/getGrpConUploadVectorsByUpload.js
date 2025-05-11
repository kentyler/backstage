/**
 * Get group conversation upload vectors by upload ID
 * @module db/grpConUploadVectors/getGrpConUploadVectorsByUpload
 */

import { pool } from '../connection.js';

/**
 * Get group conversation upload vectors by upload ID
 * @param {number} uploadId - The upload ID
 * @returns {Promise<Array<Object>>} - The vector records
 */
const getGrpConUploadVectorsByUpload = async (uploadId) => {
  
  
  const query = `
    SELECT *
    FROM grp_con_upload_vectors
    WHERE upload_id = $1
    ORDER BY chunk_index ASC
  `;
  
  const values = [uploadId];
  
  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error getting group conversation upload vectors by upload ID:', error);
    throw error;
  }
};

export default getGrpConUploadVectorsByUpload;