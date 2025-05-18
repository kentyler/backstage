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
 * Creates a new conversation turn
 * @param {number} conversationId - The ID of the conversation
 * @param {number} avatarId - The ID of the avatar (user/assistant)
 * @param {number} turnIndex - The index of the turn
 * @param {string} contentText - The text content of the turn
 * @param {Array} contentVector - The vector representation of the content
 * @param {number} [turnKindId=TURN_KIND.REGULAR] - The kind of turn (regular or comment)
 * @param {number} [messageTypeId] - The type of message (1 for user, 2 for LLM)
 * @param {number} [templateTopicId] - Optional template topic ID
 * @returns {Promise<Object>} The created turn
 */
async function createConversationTurn(
  conversationId,
  avatarId,
  turnIndex,
  contentText,
  contentVector = [],
  turnKindId = TURN_KIND.REGULAR,
  messageTypeId = null,
  templateTopicId = null
) {
  const normalizedVector = normalizeVector(contentVector);
  
  const queryText = `
    INSERT INTO dev.grp_con_avatar_turns
      (grp_con_id, avatar_id, turn_index, content_text, content_vector, turn_kind_id, message_type_id, template_topic_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, grp_con_id, avatar_id, turn_index, content_text, created_at, turn_kind_id, message_type_id, template_topic_id
  `;

  const values = [
    conversationId,
    avatarId,
    turnIndex,
    contentText,
    JSON.stringify(normalizedVector),
    turnKindId,
    messageTypeId,
    templateTopicId
  ];

  try {
    const { rows } = await query(queryText, values);
    return rows[0];
  } catch (error) {
    console.error('Error creating conversation turn:', error);
    throw error;
  }
}

/**
 * Gets all turns for a conversation
 * @param {string} conversationId - The ID of the conversation
 * @param {Object} client - The database client to use for the query
 * @returns {Promise<Array>} Array of conversation turns
 */
async function getConversationTurns(conversationId, client) {
  try {
    console.log('Executing getConversationTurns with:', { conversationId });
    
    const queryText = `
      SELECT id, grp_con_id, avatar_id, turn_index, content_text, created_at, turn_kind_id, message_type_id, template_topic_id
      FROM grp_con_avatar_turns 
      WHERE grp_con_id = $1
      ORDER BY turn_index ASC
    `;
    
    const result = await client.query(queryText, [conversationId]);
    
    console.log(`Found ${result.rows.length} messages for conversation ${conversationId}`);
    return result.rows;
  } catch (error) {
    console.error('Error getting conversation turns:', error);
    throw error;
  }
}

/**
 * Gets the next turn index for a conversation
 * @param {number} conversationId - The ID of the conversation
 * @returns {Promise<number>} The next turn index
 */
async function getNextTurnIndex(conversationId) {
  const queryText = `
    SELECT COALESCE(MAX(turn_index), 0) + 1 as next_index
    FROM dev.grp_con_avatar_turns
    WHERE grp_con_id = $1
  `;

  try {
    const { rows } = await query(queryText, [conversationId]);
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
 * @returns {Promise<Array>} Array of conversation turns
 */
async function getTurnsByTopicPath(topicPathId, client, limit = 100) {
  try {
    console.log('Executing getTurnsByTopicPath with:', { topicPathId, limit });
    
    const result = await client.query(
      `SELECT id, topicpathid, avatar_id, content_text, 
              message_type_id, turn_kind_id, created_at, turn_index
       FROM grp_con_avatar_turns
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
  createConversationTurn,
  getConversationTurns,
  getNextTurnIndex,
  getTurnsByTopicPath,
  TURN_KIND,
  MESSAGE_TYPE
};
