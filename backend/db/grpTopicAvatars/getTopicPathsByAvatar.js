import { pool } from '../connection.js';
const { query } = pool;

/**
 * Get all topic paths for a specific avatar
 * 
 * @param {number} avatarId - The ID of the avatar
 * @param {string|object} [schemaOrPool=null] - Schema name or custom pool
 * @returns {Promise<Array>} List of topic paths for the avatar
 */
export async function getTopicPathsByAvatar(avatarId, schemaOrPool = null) {
  if (!avatarId) {
    throw new Error('Avatar ID is required');
  }

  let client = schemaOrPool;
  let useTransaction = false;

  try {
    // If schemaOrPool is a string, use it as the schema name with the default pool
    if (typeof schemaOrPool === 'string') {
      const queryText = `
        SELECT gta.topic_path_id, tp.name, tp.created_at
        FROM ${schemaOrPool}.grp_topic_avatars gta
        JOIN ${schemaOrPool}.topic_paths tp ON gta.topic_path_id = tp.id
        WHERE gta.avatar_id = $1
        ORDER BY tp.created_at DESC
      `;
      const values = [avatarId];
      const res = await query(queryText, values);
      return res.rows;
    }
    
    // If no schema or pool is provided, use the default schema with the default pool
    if (!schemaOrPool) {
      const queryText = `
        SELECT gta.topic_path_id, tp.name, tp.created_at
        FROM grp_topic_avatars gta
        JOIN topic_paths tp ON gta.topic_path_id = tp.id
        WHERE gta.avatar_id = $1
        ORDER BY tp.created_at DESC
      `;
      const values = [avatarId];
      const res = await query(queryText, values);
      return res.rows;
    }
    
    // If a pool or client is provided, use it
    if (typeof schemaOrPool === 'object') {
      // If it doesn't have a query method, it's a pool, so get a client
      if (!schemaOrPool.query) {
        useTransaction = true;
        client = await schemaOrPool.connect();
      }
      
      const queryText = `
        SELECT gta.topic_path_id, tp.name, tp.created_at
        FROM grp_topic_avatars gta
        JOIN topic_paths tp ON gta.topic_path_id = tp.id
        WHERE gta.avatar_id = $1
        ORDER BY tp.created_at DESC
      `;
      const values = [avatarId];
      const res = await client.query(queryText, values);
      return res.rows;
    }
  } catch (error) {
    console.error('Error getting topic paths by avatar:', error);
    throw error;
  } finally {
    // Release the client if we created one
    if (client && useTransaction) {
      client.release();
    }
  }
}
