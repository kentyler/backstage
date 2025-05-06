/**
 * Delete a group conversation upload record
 * @module db/grpConUploads/deleteGrpConUpload
 */

import { pool, createPool } from '../connection.js';

/**
 * Delete a group conversation upload record
 * @param {number} id - The upload ID
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<boolean>} - True if deletion was successful
 */
const deleteGrpConUpload = async (id, customPoolOrSchema = null) => {
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
    DELETE FROM grp_con_uploads
    WHERE id = $1
    RETURNING id
  `;
  
  try {
    const result = await currentPool.query(query, [id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error deleting group conversation upload:', error);
    throw error;
  }
};

export default deleteGrpConUpload;