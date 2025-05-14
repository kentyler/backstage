// createGrpConAvatarTurnRelationship.js


/**
 * Creates a directed relationship between two avatar turns.
 * @param {number} turnId
 * @param {number} targetTurnId
 * @param {number} [relationshipTypeId=1]
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<object>}
 */
export async function createGrpConAvatarTurnRelationship(
  turnId,
  targetTurnId,
  relationshipTypeId = 1, pool
) {
  const sql = `
    INSERT INTO grp_con_avatar_turn_relationships
      (turn_id, target_turn_id, turn_relationship_type_id)
    VALUES ($1, $2, $3)
    RETURNING id, turn_id, target_turn_id, turn_relationship_type_id, created_at
  `;
  const { rows } = await pool.query(sql, [turnId, targetTurnId, relationshipTypeId]);
  return rows[0];
}