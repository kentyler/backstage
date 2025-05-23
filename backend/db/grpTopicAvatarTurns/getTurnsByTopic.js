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
 * @param {number} [limit=100] - Maximum number of turns to return
 * @returns {Promise<Array>} Array of topic turns
 */
export async function getTurnsByTopicId(topicId, pool, limit = 100) {
  try {
    console.log('Executing getTurnsByTopicId with:', { topicId, limit });
    
    // Validate that we have a proper pool object
    if (!pool || typeof pool.query !== 'function') {
      console.error('Invalid pool object provided to getTurnsByTopicId:', pool);
      throw new Error('Invalid database pool object');
    }
    
    // Use the view directly and let the pool's schema search path handle it
    // This is the safest approach with dynamic schemas
    const result = await pool.query(
      `SELECT id, topic_id, avatar_id, content_text, 
              message_type_id, turn_kind_id, created_at, turn_index,
              llm_id, participant_id, participant_name,
              llm_name
       FROM grp_topic_avatar_turns_with_names
       WHERE topic_id = $1
       ORDER BY turn_index ASC
       LIMIT $2`,
      [topicId, limit]
    );
    
    console.log(`Found ${result.rows.length} messages for topic ID ${topicId}`);
    
    // Add detailed logging for the row data
    result.rows.forEach((row, idx) => {
      console.log(`Message ${idx} DB data:`, {
        id: row.id,
        topic_id: row.topic_id,
        message_type_id: row.message_type_id,
        participant_id: row.participant_id,
        participant_name: row.participant_name,
        llm_id: row.llm_id,
        llm_name: row.llm_name
      });
    });
    
    return result.rows.map(row => ({
      id: row.id,
      topicId: row.topic_id,
      avatarId: row.avatar_id,
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
