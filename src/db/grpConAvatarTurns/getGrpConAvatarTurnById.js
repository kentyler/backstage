// src/db/grpConAvatarTurns/getGrpConAvatarTurnById.js

/**
 * Get a group conversation avatar turn by ID
 * @param {number} id - The ID of the turn to retrieve
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<object|null>} The turn object or null if not found
 */
export async function getGrpConAvatarTurnById(id, pool) {
  // Determine which pool to use
  let customPool = pool;
  if (schemaOrPool) {
    if (typeof schemaOrPool === 'string') {
      // If a schema name is provided, create a pool for that schema
      customPool = createPool(schemaOrPool);
    } else {
      // If a pool object is provided, use it
      customPool = schemaOrPool;
    }
  } else {
    // If no schema or pool is provided, use the default schema
    customPool = createPool(getDefaultSchema());
  }

  const query = `
    SELECT id, grp_con_id, avatar_id, turn_index, content_text, content_vector, created_at, turn_kind_id
      FROM grp_con_avatar_turns
     WHERE id = $1
  `;
  const { rows } = await customPool.query(query, [id]);
  return rows[0] || null;
}
