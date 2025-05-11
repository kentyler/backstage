/**
 * Delete a group conversation upload record
 * @module db/grpConUploads/deleteGrpConUpload
 */

import { pool } from '../connection.js';

/**
 * Delete a group conversation upload record
 * @param {number} id - The upload ID
 * 
 * @returns {Promise<boolean>} - True if deletion was successful
 */
const deleteGrpConUpload = async (id) => {
 
  
  const query = `
    DELETE FROM grp_con_uploads
    WHERE id = $1
    RETURNING id
  `;
  
  try {
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error deleting group conversation upload:', error);
    throw error;
  }
};

export default deleteGrpConUpload;