// src/db/participantTopicTurns/createParticipantTopicTurn.js

const VECTOR_DIM = 1536;

// Turn kind IDs
export const TURN_KIND = {
  REGULAR: 1,
  COMMENT: 3
};

// Message type IDs
export const MESSAGE_TYPE = {
  USER: 1,
  LLM: 2
};

function normalizeVector(arr) {
  // If contentVector is null or undefined, return an empty array of the right dimension
  if (!arr) return new Array(VECTOR_DIM).fill(0);
  if (!Array.isArray(arr)) throw new TypeError('contentVector must be an array');
  if (arr.length === VECTOR_DIM) return arr;
  if (arr.length > VECTOR_DIM) return arr.slice(0, VECTOR_DIM);
  return arr.concat(new Array(VECTOR_DIM - arr.length).fill(0));
}

function toVectorLiteral(arr) {
  return `[${arr.join(',')}]`;
}

/**
 * Creates a new participant topic turn
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @param {string} topicId - The ID of the topic
 * @param {number} participantId - The ID of the participant
 * @param {number|string} turnIndex - The index of the turn (can be decimal for comments)
 * @param {string} contentText - The text content of the turn
 * @param {Array} contentVector - The vector representation of the content
 * @param {number} [turnKindId=TURN_KIND.REGULAR] - The kind of turn (regular or comment)
 * @param {number} [messageTypeId=null] - The type of message (1 for user, 2 for LLM)
 * @param {number} [llmId=null] - The ID of the LLM used (for assistant messages)
 * @param {string|object} clientPool - Either a schema name or a pool object
 * @returns {Promise<Object>} The created turn
 */
export async function createParticipantTopicTurn(
  topicId,
  participantId, 
  turnIndex, 
  contentText, 
  contentVector, 
  turnKindId = TURN_KIND.REGULAR,
  messageTypeId = null,
  llmId = null,
  clientPool = null
) {
  // Determine which pool to use
  let customPool = clientPool;
  
  console.log('createParticipantTopicTurn called with clientPool:', clientPool ? 'provided' : 'not provided');
  
  if (clientPool) {
    // If a pool object is provided, use it
    console.log('Using provided client pool');
    customPool = clientPool;
  } else {
    // Use default schema if no schema or pool is provided
    const { getDefaultSchema } = await import('../../config/schema.js');
    const { createPool } = await import('../connection.js');
    
    const defaultSchema = getDefaultSchema();
    console.log('No schema or pool provided, using default schema:', defaultSchema);
    if (defaultSchema !== 'public') {
      console.log('Creating pool with default schema:', defaultSchema);
      customPool = createPool(defaultSchema);
    } else {
      console.log('Using default pool (public schema)');
    }
  }
  
  console.log('Final pool to be used for query:', customPool ? 'Custom pool' : 'Default pool');

  const normalized = normalizeVector(contentVector);
  const vecLit     = toVectorLiteral(normalized);

  // Using participant_topic_turns table
  const query = `
    INSERT INTO participant_topic_turns
      (topic_id, participant_id, turn_index, content_text, content_vector, turn_kind_id, message_type_id, llm_id)
    VALUES ($1, $2, $3, $4, $5::vector, $6, $7, $8)
    RETURNING id, topic_id, participant_id, turn_index, content_text, content_vector, created_at, turn_kind_id, message_type_id, llm_id
  `;
  const { rows } = await customPool.query(query, [
    topicId,
    participantId,
    turnIndex,
    contentText,
    vecLit,
    turnKindId,
    messageTypeId,
    llmId
  ]);
  const row = rows[0];
  row.content_vector = normalized;
  return row;
}