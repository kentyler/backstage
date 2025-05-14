// getGrpConnAvatarTurnRelationshipsByTurn.js

/**
 * Lists all relationships originating from a turn.
 * @param {number} turnId
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<object[]>}
 */
export async function getGrpConAvatarTurnRelationshipsByTurn(turnId, pool) {
  const sql = `
    SELECT id, turn_id, target_turn_id, turn_relationship_type_id, created_at
      FROM grp_con_avatar_turn_relationships
     WHERE turn_id = $1
     ORDER BY id
  `;
  const { rows } = await pool.query(sql, [turnId]);
  return rows;
}