import { pool } from '../connection.js';
const { query } = pool;

/**
 * Inserts a new row into grp_topic_avatars.
 *
 * @param {string} topicPathId - The ID of the topic path
 * @param {number} avatarId - The ID of the avatar
 * @param {string|object} [schemaOrPool=null] - Schema name or custom pool
 * @returns {Promise<Object>} The newly created record
 */
export async function createGrpTopicAvatar(topicPathId, avatarId, schemaOrPool = null) {
  if (!topicPathId) {
    throw new Error('Topic path ID is required');
  }
  
  if (!avatarId) {
    throw new Error('Avatar ID is required');
  }

  let client = schemaOrPool;
  let useTransaction = false;

  try {
    // If schemaOrPool is a string, use it as the schema name with the default pool
    if (typeof schemaOrPool === 'string') {
      const queryText = `
        INSERT INTO ${schemaOrPool}.grp_topic_avatars 
        (topic_path_id, avatar_id) 
        VALUES ($1, $2) 
        RETURNING *
      `;
      const values = [topicPathId, avatarId];
      const res = await query(queryText, values);
      return res.rows[0];
    }
    
    // If no schema or pool is provided, use the default schema with the default pool
    if (!schemaOrPool) {
      const queryText = `
        INSERT INTO grp_topic_avatars 
        (topic_path_id, avatar_id) 
        VALUES ($1, $2) 
        RETURNING *
      `;
      const values = [topicPathId, avatarId];
      const res = await query(queryText, values);
      return res.rows[0];
    }
    
    // If a pool or client is provided, use it
    if (typeof schemaOrPool === 'object') {
      // If it doesn't have a query method, it's a pool, so get a client
      if (!schemaOrPool.query) {
        useTransaction = true;
        client = await schemaOrPool.connect();
      }
      
      const queryText = `
        INSERT INTO grp_topic_avatars 
        (topic_path_id, avatar_id) 
        VALUES ($1, $2) 
        RETURNING *
      `;
      const values = [topicPathId, avatarId];
      const res = await client.query(queryText, values);
      return res.rows[0];
    }
  } catch (error) {
    console.error('Error creating grp_topic_avatar:', error);
    throw error;
  } finally {
    // Release the client if we created one
    if (client && useTransaction) {
      client.release();
    }
  }
}
