// updateGrpConAvatarTurnRelationship.js

/**
 * Updates the relationship type of an existing relationship.
 * @param {number} id
 * @param {number} newTypeId
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<object|null>}
 */
export async function updateGrpConAvatarTurnRelationship(id, newTypeId, pool) {
  const sql = `
    UPDATE grp_con_avatar_turn_relationships
       SET turn_relationship_type_id = $2
     WHERE id = $1
     RETURNING id, turn_id, target_turn_id, turn_relationship_type_id, created_at
  `;
  const { rows } = await pool.query(sql, [id, newTypeId]);
  return rows[0] || null;
}