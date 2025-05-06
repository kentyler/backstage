/**
 * Get a group conversation upload by ID
 * @module db/grpConUploads/getGrpConUploadById
 */

import { pool, createPool } from '../connection.js';

/**
 * Get a group conversation upload by ID
 * @param {number} id - The upload ID
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<Object|null>} - The upload record or null if not found
 */
const getGrpConUploadById = async (id, customPoolOrSchema = null) => {
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
    SELECT * FROM grp_con_uploads
    WHERE id = $1
  `;
  
  try {
    const result = await currentPool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting group conversation upload by ID:', error);
    throw error;
  }
};

export default getGrpConUploadById;