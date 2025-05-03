// src/db/grpConAvatars/createGrpConAvatar.js
/**
 * @file src/db/grpConAvatars/createGrpConAvatar.js
 * @description Adds an avatar to a group conversation.
 */
import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Inserts a new row into grp_con_avatars.
 *
 * @param {number} conversationId
 * @param {number} avatarId
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<{grp_con_id: number, avatar_id: number, added_at: string}>}
 */
export async function createGrpConAvatar(conversationId, avatarId, customPoolOrSchema = null) {
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
    INSERT INTO grp_con_avatars
      (grp_con_id, avatar_id)
    VALUES ($1, $2)
    RETURNING grp_con_id, avatar_id, added_at
  `;
  const { rows } = await customPool.query(query, [conversationId, avatarId]);
  return rows[0];
}