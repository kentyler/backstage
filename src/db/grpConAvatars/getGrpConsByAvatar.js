// src/db/grpConAvatars/getGrpConsByAvatar.js
/**
 * @file src/db/grpConAvatars/getGrpConsByAvatar.js
 * @description Lists all conversations that include a given avatar.
 */
import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Fetches conversation entries for one avatar.
 *
 * @param {number} avatarId
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<Array<{grp_con_id: number, added_at: string}>>}
 */
export async function getGrpConsByAvatar(avatarId, customPoolOrSchema = null) {
  // Determine which pool to use
  let customPool = pool;
  
  if (customPoolOrSchema) {
    if (typeof customPoolOrSchema === 'string') {
      // If a schema name is provided, create a pool for that schema
      customPool = createPool(customPoolOrSchema);
    } else {
      // If a pool object is provided, use it
      customPool = customPoolOrSchema;
    }
  } else {
    // Use default schema if no schema or pool is provided
    const defaultSchema = getDefaultSchema();
    if (defaultSchema !== 'public') {
      customPool = createPool(defaultSchema);
    }
  }

  const query = `
    SELECT grp_con_id, added_at
    FROM grp_con_avatars
    WHERE avatar_id = $1
    ORDER BY added_at
  `;
  const { rows } = await customPool.query(query, [avatarId]);
  return rows;
}