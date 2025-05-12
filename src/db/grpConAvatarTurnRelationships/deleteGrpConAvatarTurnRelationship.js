// deleteGrpConAvatarTurnRelationship.js

/**
 * Deletes a relationship by its ID.
 * @param {number} id
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<boolean>}
 */
export async function deleteGrpConAvatarTurnRelationship(id, pool) {
  const sql = `
    DELETE FROM grp_con_avatar_turn_relationships
     WHERE id = $1
  `;
  const { rowCount } = await pool.query(sql, [id]);
  return rowCount > 0;
}