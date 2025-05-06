/**
 * Get group conversation upload vectors by upload ID
 * @module db/grpConUploadVectors/getGrpConUploadVectorsByUpload
 */

import { pool, createPool } from '../connection.js';

/**
 * Get group conversation upload vectors by upload ID
 * @param {number} uploadId - The upload ID
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<Array<Object>>} - The vector records
 */
const getGrpConUploadVectorsByUpload = async (uploadId, customPoolOrSchema = null) => {
  // Determine which pool to use
  let currentPool = pool;
  
  if (customPoolOrSchema) {
    if (typeof customPoolOrSchema === 'string') {
      // If a schema name is provided, create a pool for that schema
      currentPool = createPool(customPoolOrSchema);
    } else {
      // If a pool object is provided, use it
      currentPool = customPoolOrSchema;
    }
  }
  
  const query = `
    SELECT *
    FROM grp_con_upload_vectors
    WHERE upload_id = $1
    ORDER BY chunk_index ASC
  `;
  
  const values = [uploadId];
  
  try {
    const result = await currentPool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error getting group conversation upload vectors by upload ID:', error);
    throw error;
  }
};

export default getGrpConUploadVectorsByUpload;