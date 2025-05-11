// src/db/grpCons/deleteGrpCon.js
import { pool } from '../connection.js';

/**
 * Deletes a conversation by its ID.
 * @param {number} id - The conversation ID.
 * @returns {Promise<boolean>} True if deleted, false otherwise.
 */
export async function deleteGrpCon(id) {
  const query = `
    DELETE FROM grp_cons
    WHERE id = $1
    RETURNING id
  `;
  const result = await pool.query(query, [id]);
  return result.rowCount > 0;
}