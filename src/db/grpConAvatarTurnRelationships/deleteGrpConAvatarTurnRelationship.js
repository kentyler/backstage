// deleteGrpConAvatarTurnRelationship.js
import { pool } from '../connection.js';

/**
 * Deletes a relationship by its ID.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function deleteGrpConAvatarTurnRelationship(id) {
  const sql = `
    DELETE FROM grp_con_avatar_turn_relationships
     WHERE id = $1
  `;
  const { rowCount } = await pool.query(sql, [id]);
  return rowCount > 0;
}