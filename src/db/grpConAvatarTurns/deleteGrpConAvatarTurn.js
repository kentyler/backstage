// src/db/grpConAvatarTurns/deleteGrpConAvatarTurn.js
import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Delete a group conversation avatar turn by ID
 * @param {number} id - The ID of the turn to delete
 * @param {string|object} schemaOrPool - Either a schema name or a pool object
 * @returns {Promise<boolean>} True if the turn was deleted, false if not found
 */
export async function deleteGrpConAvatarTurn(id, schemaOrPool = null) {
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
    DELETE FROM grp_con_avatar_turns
     WHERE id = $1
  `;
  const { rowCount } = await customPool.query(query, [id]);
  return rowCount > 0;
}
