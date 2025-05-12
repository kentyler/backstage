// getGrpConAvatarTurnRelationshipById.js

/**
 * Fetches a relationship by its ID.
 * @param {number} id
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<object|null>}
 */
export async function getGrpConAvatarTurnRelationshipById(id, pool) {
  const sql = `
    SELECT id, turn_id, target_turn_id, turn_relationship_type_id, created_at
      FROM grp_con_avatar_turn_relationships
     WHERE id = $1
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
}