// getGrpConnAvatarTurnRelationshipsByTurn.js
import { pool } from '../connection.js';

/**
 * Lists all relationships originating from a turn.
 * @param {number} turnId
 * @returns {Promise<object[]>}
 */
export async function getGrpConAvatarTurnRelationshipsByTurn(turnId) {
  const sql = `
    SELECT id, turn_id, target_turn_id, turn_relationship_type_id, created_at
      FROM public.grp_con_avatar_turn_relationships
     WHERE turn_id = $1
     ORDER BY id
  `;
  const { rows } = await pool.query(sql, [turnId]);
  return rows;
}