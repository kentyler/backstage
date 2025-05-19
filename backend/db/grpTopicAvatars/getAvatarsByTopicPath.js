import { pool } from '../connection.js';
const { query } = pool;

/**
 * Get all avatars for a specific topic path
 * 
 * @param {string} topicPathId - The ID of the topic path
 * @param {string|object} [schemaOrPool=null] - Schema name or custom pool
 * @returns {Promise<Array>} List of avatars for the topic path
 */
export async function getAvatarsByTopicPath(topicPathId, schemaOrPool = null) {
  if (!topicPathId) {
    throw new Error('Topic path ID is required');
  }

  let client = schemaOrPool;
  let useTransaction = false;

  try {
    // If schemaOrPool is a string, use it as the schema name with the default pool
    if (typeof schemaOrPool === 'string') {
      const queryText = `
        SELECT a.id, a.name, a.description, a.llm_id, a.system_prompt, a.created_at, a.updated_at
        FROM ${schemaOrPool}.grp_topic_avatars gta
        JOIN ${schemaOrPool}.avatars a ON gta.avatar_id = a.id
        WHERE gta.topic_path_id = $1
      `;
      const values = [topicPathId];
      const res = await query(queryText, values);
      return res.rows;
    }
    
    // If no schema or pool is provided, use the default schema with the default pool
    if (!schemaOrPool) {
      const queryText = `
        SELECT a.id, a.name, a.description, a.llm_id, a.system_prompt, a.created_at, a.updated_at
        FROM grp_topic_avatars gta
        JOIN avatars a ON gta.avatar_id = a.id
        WHERE gta.topic_path_id = $1
      `;
      const values = [topicPathId];
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
        SELECT a.id, a.name, a.description, a.llm_id, a.system_prompt, a.created_at, a.updated_at
        FROM grp_topic_avatars gta
        JOIN avatars a ON gta.avatar_id = a.id
        WHERE gta.topic_path_id = $1
      `;
      const values = [topicPathId];
      const res = await client.query(queryText, values);
      return res.rows;
    }
  } catch (error) {
    console.error('Error getting avatars by topic path:', error);
    throw error;
  } finally {
    // Release the client if we created one
    if (client && useTransaction) {
      client.release();
    }
  }
}
