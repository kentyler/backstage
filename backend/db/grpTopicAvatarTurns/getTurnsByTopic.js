/**
 * Functions for getting turns by topic ID or path
 */

// Import the message type constants
const MESSAGE_TYPE = {
  USER: 1,
  LLM: 2
};

/**
 * Gets all turns for a topic using its numeric ID
 * @param {number} topicId - The numeric ID of the topic
 * @param {Pool} pool - The PostgreSQL connection pool
 * @returns {Promise<Array>} Array of topic turns
 */
export async function getTurnsByTopicId(topicId, pool) {
  try {
    console.log('Executing getTurnsByTopicId with:', { topicId });
    
    // Validate that we have a proper pool object
    if (!pool || typeof pool.query !== 'function') {
      console.error('Invalid pool object provided to getTurnsByTopicId:', pool);
      throw new Error('Invalid database pool object');
    }
    
    // Get a dedicated client to ensure schema context is maintained
    const client = await pool.connect();
    let result;
    
    try {
      // Make sure we're using the same schema context as the pool
      // This should match the schema set by the middleware
      const schemaResult = await client.query('SHOW search_path');
      const currentSchemaPath = schemaResult.rows[0].search_path;
      console.log('Current search_path for topic message query:', currentSchemaPath);
      
      // If the schema doesn't include 'dev', set it explicitly
      if (!currentSchemaPath.includes('dev')) {
        console.log('Schema path does not include dev schema, setting it explicitly');
        await client.query('SET search_path TO dev, public');
        const updatedSchema = await client.query('SHOW search_path');
        console.log('Updated search_path:', updatedSchema.rows[0].search_path);
      }
      
      // Use the view with a dedicated client to maintain schema context
      result = await client.query(
        `SELECT id, topic_id, content_text, 
                message_type_id, turn_kind_id, created_at, turn_index,
                llm_id, participant_id, participant_name,
                llm_name
         FROM participant_topic_turns_with_names
         WHERE topic_id = $1
         ORDER BY turn_index ASC`,
        [topicId]
      );
    } finally {
      // Always release the client back to the pool
      client.release();
      console.log('Released client back to the pool after topic message query');
    }
    
    console.log(`Found ${result ? result.rows.length : 0} messages for topic ID ${topicId}`);
    
    // Add detailed logging for the row data if result exists
    if (result && result.rows) {
      result.rows.forEach((row, idx) => {
        console.log(`Message ${idx + 1} (ID: ${row.id}):`, {
          id: row.id,
          topic_id: row.topic_id,
          message_type_id: row.message_type_id,
          participant_id: row.participant_id,
          participant_name: row.participant_name,
          llm_id: row.llm_id,
          llm_name: row.llm_name
        });
      });
    }
    
    // Make sure result exists before trying to access it
    if (!result || !result.rows) {
      console.error('No results returned from database for topic ID:', topicId);
      return [];
    }
    
    return result.rows.map(row => ({
      id: row.id,
      topicId: row.topic_id,
      content: row.content_text,
      isUser: row.message_type_id === MESSAGE_TYPE.USER,
      turn_kind_id: row.turn_kind_id, // Keep in snake_case for frontend compatibility
      createdAt: row.created_at,
      turnIndex: row.turn_index,
      llmId: row.llm_id,
      participantId: row.participant_id,
      participantName: row.participant_name,
      llmName: row.llm_name
    }));
  } catch (error) {
    console.error('Error getting turns by topic ID:', error);
    // Return empty array instead of throwing an error to avoid 500 responses
    return [];
  }
}

/**
 * Gets the next turn index for a topic
 * @param {number} topicId - The numeric ID of the topic
 * @param {Pool} pool - The PostgreSQL connection pool
 * @returns {Promise<number>} The next turn index
 */
export async function getNextTurnIndex(topicId, pool) {
  try {
    const result = await pool.query(
      'SELECT COALESCE(MAX(turn_index), 0) + 1 as next_index FROM grp_topic_avatar_turns WHERE topic_id = $1',
      [topicId]
    );
    return result.rows[0].next_index;
  } catch (error) {
    console.error('Error getting next turn index:', error);
    throw error;
  }
}

export { MESSAGE_TYPE };
