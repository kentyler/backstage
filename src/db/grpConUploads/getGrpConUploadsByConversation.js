/**
 * Get all uploads for a specific group conversation
 * @module db/grpConUploads/getGrpConUploadsByConversation
 */

import { pool } from '../connection.js';

/**
 * Get all uploads for a specific group conversation
 * @param {number} grpConId - The group conversation ID
 * @returns {Promise<Array>} - Array of upload records
 */
const getGrpConUploadsByConversation = async (grpConId) => {
    
  const query = `
    SELECT * FROM grp_con_uploads
    WHERE grp_con_id = $1
    ORDER BY uploaded_at DESC
  `;
  
  try {
    const result = await pool.query(query, [grpConId]);
    return result.rows;
  } catch (error) {
    console.error('Error getting uploads for conversation:', error);
    throw error;
  }
};

export default getGrpConUploadsByConversation;