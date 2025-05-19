import { pool } from './connection.js';
const { query } = pool;

// Constants
const VECTOR_DIM = 1536;

// Turn kind IDs
const TURN_KIND = {
  REGULAR: 1,
  COMMENT: 3
};

// Message type IDs
const MESSAGE_TYPE = {
  USER: 1,
  LLM: 2
};

/**
 * Normalizes a vector to the required dimensions
 * @param {Array} arr - The vector array to normalize
 * @returns {Array} - Normalized vector
 */
function normalizeVector(arr) {
  if (!Array.isArray(arr)) throw new TypeError('contentVector must be an array');
  if (arr.length === VECTOR_DIM) return arr;
  if (arr.length > VECTOR_DIM) return arr.slice(0, VECTOR_DIM);
  return arr.concat(new Array(VECTOR_DIM - arr.length).fill(0));
}

/**
 * Gets the next turn index for a topic path
 * @param {string} topicPathId - The ID of the topic path
 * @returns {Promise<number>} The next turn index
 */
async function getNextTurnIndex(topicPathId) {
  const queryText = `
    SELECT COALESCE(MAX(turn_index), 0) + 1 as next_index
    FROM dev.grp_topic_avatar_turns
    WHERE topicpathid = $1
  `;

  try {
    const { rows } = await query(queryText, [topicPathId]);
    return parseFloat(rows[0].next_index);
  } catch (error) {
    console.error('Error getting next turn index:', error);
    throw error;
  }
}

/**
 * Gets all turns for a topic path
 * @param {string} topicPathId - The ID of the topic path
 * @param {Object} client - The database client to use for the query
 * @param {number} [limit=100] - Maximum number of turns to return
 * @returns {Promise<Array>} Array of topic path turns
 */
async function getTurnsByTopicPath(topicPathId, client, limit = 100) {
  try {
    console.log('Executing getTurnsByTopicPath with:', { topicPathId, limit });
    
    const result = await client.query(
      `SELECT id, topicpathid, avatar_id, content_text, 
              message_type_id, turn_kind_id, created_at, turn_index
       FROM grp_topic_avatar_turns
       WHERE topicpathid = $1
       ORDER BY turn_index ASC
       LIMIT $2`,
      [topicPathId, limit]
    );
    
    console.log(`Found ${result.rows.length} messages for topic path ${topicPathId}`);
    
    return result.rows.map(row => ({
      id: row.id,
      topicPathId: row.topicpathid,
      avatarId: row.avatar_id,
      content: row.content_text,
      isUser: row.message_type_id === MESSAGE_TYPE.USER,
      turnKindId: row.turn_kind_id,
      createdAt: row.created_at,
      turnIndex: row.turn_index
    }));
  } catch (error) {
    console.error('Error getting turns by topic path:', error);
    throw error;
  }
}

export {
  getNextTurnIndex,
  getTurnsByTopicPath,
  TURN_KIND,
  MESSAGE_TYPE
};
