/**
 * Get all uploads for a specific group conversation
 * @module db/grpConUploads/getGrpConUploadsByConversation
 */

import { pool, createPool } from '../connection.js';

/**
 * Get all uploads for a specific group conversation
 * @param {number} grpConId - The group conversation ID
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<Array>} - Array of upload records
 */
const getGrpConUploadsByConversation = async (grpConId, customPoolOrSchema = null) => {
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
    WHERE grp_con_id = $1
    ORDER BY uploaded_at DESC
  `;
  
  try {
    const result = await currentPool.query(query, [grpConId]);
    return result.rows;
  } catch (error) {
    console.error('Error getting uploads for conversation:', error);
    throw error;
  }
};

export default getGrpConUploadsByConversation;