// src/db/grpConAvatarTurns/deleteGrpConAvatarTurn.js
import { pool } from '../connection.js';

/**
 * Delete a group conversation avatar turn by ID
 * @param {number} id - The ID of the turn to delete
 * @param {string|object} schemaOrPool - Either a schema name or a pool object
 * @returns {Promise<boolean>} True if the turn was deleted, false if not found
 */
export async function deleteGrpConAvatarTurn(id) {
  

  const query = `
    DELETE FROM grp_con_avatar_turns
     WHERE id = $1
  `;
  const { rowCount } = await pool.query(query, [id]);
  return rowCount > 0;
}
