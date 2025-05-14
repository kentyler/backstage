// src/db/grpConAvatars/deleteGrpConAvatar.js
/**
 * @file src/db/grpConAvatars/deleteGrpConAvatar.js
 * @description Removes an avatar from a conversation.
 */

/**
 * Deletes the link between an avatar and a conversation.
 *  @param { Pool } pool - The PostgreSQL connection pool.
 * @param {number} conversationId
 * @param {number} avatarId
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<boolean>} true if deleted, false otherwise
 */
export async function deleteGrpConAvatar(conversationId, avatarId, pool) {
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
    DELETE FROM grp_con_avatars
    WHERE grp_con_id = $1
      AND avatar_id = $2
  `;
  const result = await customPool.query(query, [conversationId, avatarId]);
  return result.rowCount > 0;
}