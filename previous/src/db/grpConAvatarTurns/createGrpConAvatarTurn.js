// src/db/grpConAvatarTurns/createGrpConAvatarTurn.js

const VECTOR_DIM = 1536;

// Turn kind IDs
export const TURN_KIND = {
  REGULAR: 1,
  COMMENT: 3
};

function normalizeVector(arr) {
  if (!Array.isArray(arr)) throw new TypeError('contentVector must be an array');
  if (arr.length === VECTOR_DIM) return arr;
  if (arr.length > VECTOR_DIM) return arr.slice(0, VECTOR_DIM);
  return arr.concat(new Array(VECTOR_DIM - arr.length).fill(0));
}

function toVectorLiteral(arr) {
  return `[${arr.join(',')}]`;
}

/**
 * Creates a new avatar turn in a group conversation
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @param {number} conversationId - The ID of the conversation
 * @param {number} avatarId - The ID of the avatar
 * @param {number|string} turnIndex - The index of the turn (can be decimal for comments)
 * @param {string} contentText - The text content of the turn
 * @param {Array} contentVector - The vector representation of the content
 * @param {number} [turnKindId=TURN_KIND.REGULAR] - The kind of turn (regular or comment)
 * @param {number} [messageTypeId=null] - The type of message (1 for user, 2 for LLM)
 * @param {string|object} schemaOrPool - Either a schema name or a pool object
 * @returns {Promise<Object>} The created turn
 */
export async function createGrpConAvatarTurn(
  conversationId, 
  avatarId, 
  turnIndex, 
  contentText, 
  contentVector, 
  turnKindId = TURN_KIND.REGULAR,
  messageTypeId = null, 
  clientPool = null
) {
  // Determine which pool to use
  let customPool = clientPool;
  
  console.log('createGrpConAvatarTurn called with clientPool:', clientPool ? 'provided' : 'not provided');
  
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

  const query = `
    INSERT INTO grp_con_avatar_turns
      (grp_con_id, turn_kind_id, avatar_id, turn_index, content_text, content_vector, message_type_id)
    VALUES ($1, $2, $3, $4, $5, $6::vector, $7)
    RETURNING id, grp_con_id, avatar_id, turn_index, content_text, content_vector, created_at, turn_kind_id, message_type_id
  `;
  const { rows } = await customPool.query(query, [
    conversationId,
    turnKindId,
    avatarId,
    turnIndex,
    contentText,
    vecLit,
    messageTypeId,
  ]);
  const row = rows[0];
  row.content_vector = normalized;
  return row;
}
