// src/db/grpTopicAvatarTurns/getTurnsByTopic.js

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
 * @param {number} [limit=100] - Maximum number of turns to return
 * @param {Pool} pool - The PostgreSQL connection pool
 * @returns {Promise<Array>} Array of topic turns
 */
export async function getTurnsByTopicId(topicId, limit = 100, pool) {
  try {
    console.log('Executing getTurnsByTopicId with:', { topicId, limit });
    
    // Use the topic_id directly with the query
    const result = await pool.query(
      `SELECT id, topic_id, avatar_id, content_text, 
              message_type_id, turn_kind_id, created_at, turn_index
       FROM grp_topic_avatar_turns
       WHERE topic_id = $1
       ORDER BY turn_index ASC
       LIMIT $2`,
      [topicId, limit]
    );
    
    console.log(`Found ${result.rows.length} messages for topic ID ${topicId}`);
    
    return result.rows.map(row => ({
      id: row.id,
      topicId: row.topic_id,
      avatarId: row.avatar_id,
      content: row.content_text,
      isUser: row.message_type_id === MESSAGE_TYPE.USER,
      turnKindId: row.turn_kind_id,
      createdAt: row.created_at,
      turnIndex: row.turn_index
    }));
  } catch (error) {
    console.error('Error getting turns by topic ID:', error);
    // Return empty array instead of throwing an error to avoid 500 responses
    return [];
  }
}

/**
 * Gets all turns for a topic path
 * @param {string} topicPathId - The ID of the topic path
 * @param {number} [limit=100] - Maximum number of turns to return
 * @param {Pool} pool - The PostgreSQL connection pool
 * @returns {Promise<Array>} Array of topic path turns
 */
export async function getTurnsByTopicPath(topicPathId, limit = 100, pool) {
  try {
    console.log('Executing getTurnsByTopicPath with:', { topicPathId, limit });
    
    // First convert the path ID to a numeric ID
    const topicResult = await pool.query(
      `SELECT id FROM dev.topic_paths WHERE index = $1`,
      [topicPathId]
    );
    
    if (topicResult.rows.length === 0) {
      console.log(`No topic found with path ${topicPathId}`);
      return [];
    }
    
    const topicId = topicResult.rows[0].id;
    console.log(`Found topic ID ${topicId} for path ${topicPathId}`);
    
    // Use the numeric topic_id for the query
    const result = await pool.query(
      `SELECT id, topic_id, avatar_id, content_text, 
              message_type_id, turn_kind_id, created_at, turn_index
       FROM grp_topic_avatar_turns
       WHERE topic_id = $1
       ORDER BY turn_index ASC
       LIMIT $2`,
      [topicId, limit]
    );
    
    console.log(`Found ${result.rows.length} messages for topic path ${topicPathId}`);
    
    return result.rows.map(row => ({
      id: row.id,
      topicId: row.topic_id,
      avatarId: row.avatar_id,
      content: row.content_text,
      isUser: row.message_type_id === MESSAGE_TYPE.USER,
      turnKindId: row.turn_kind_id,
      createdAt: row.created_at,
      turnIndex: row.turn_index
    }));
  } catch (error) {
    console.error('Error getting turns by topic path:', error);
    // Return empty array instead of throwing an error
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
      `SELECT COALESCE(MAX(turn_index), 0) + 1 as next_index
       FROM grp_topic_avatar_turns
       WHERE topic_id = $1`,
      [topicId]
    );
    
    return parseFloat(result.rows[0].next_index);
  } catch (error) {
    console.error('Error getting next turn index:', error);
    throw error;
  }
}

export { MESSAGE_TYPE };
