// src/db/grpConAvatars/getGrpConAvatarsByConversation.js
/**
 * @file src/db/grpConAvatars/getGrpConAvatarsByConversation.js
 * @description Lists all avatars in a given conversation.
 */
import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Fetches avatar entries for one conversation.
 *
 * @param {number} conversationId
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<Array<{avatar_id: number, added_at: string}>>}
 */
export async function getGrpConAvatarsByConversation(conversationId, customPoolOrSchema = null) {
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
    SELECT avatar_id, added_at
    FROM grp_con_avatars
    WHERE grp_con_id = $1
    ORDER BY added_at
  `;
  const { rows } = await customPool.query(query, [conversationId]);
  return rows;
}