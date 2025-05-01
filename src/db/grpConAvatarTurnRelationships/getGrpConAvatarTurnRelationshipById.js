// getGrpConAvatarTurnRelationshipById.js
import { pool } from '../connection.js';

/**
 * Fetches a relationship by its ID.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export async function getGrpConAvatarTurnRelationshipById(id) {
  const sql = `
    SELECT id, turn_id, target_turn_id, turn_relationship_type_id, created_at
      FROM public.grp_con_avatar_turn_relationships
     WHERE id = $1
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
}