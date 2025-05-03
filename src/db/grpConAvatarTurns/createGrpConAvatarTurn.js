// src/db/grpConAvatarTurn/createAvatarTurn.js
import { pool } from '../connection.js';

const VECTOR_DIM = 1536;

// Turn kind IDs
export const TURN_KIND = {
  REGULAR: 1,
  COMMENT: 2
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
 * 
 * @param {number} conversationId - The ID of the conversation
 * @param {number} avatarId - The ID of the avatar
 * @param {number|string} turnIndex - The index of the turn (can be decimal for comments)
 * @param {string} contentText - The text content of the turn
 * @param {Array} contentVector - The vector representation of the content
 * @param {number} [turnKindId=TURN_KIND.REGULAR] - The kind of turn (regular or comment)
 * @returns {Promise<Object>} The created turn
 */
export async function createGrpConAvatarTurn(
  conversationId, 
  avatarId, 
  turnIndex, 
  contentText, 
  contentVector, 
  turnKindId = TURN_KIND.REGULAR
) {
  const normalized = normalizeVector(contentVector);
  const vecLit     = toVectorLiteral(normalized);

  const query = `
    INSERT INTO public.grp_con_avatar_turns
      (grp_con_id, turn_kind_id, avatar_id, turn_index, content_text, content_vector)
    VALUES ($1, $2, $3, $4, $5, $6::vector)
    RETURNING id, grp_con_id, avatar_id, turn_index, content_text, content_vector, created_at, turn_kind_id
  `;
  const { rows } = await pool.query(query, [
    conversationId,
    turnKindId,
    avatarId,
    turnIndex,
    contentText,
    vecLit,
  ]);
  const row = rows[0];
  row.content_vector = normalized;
  return row;
}
