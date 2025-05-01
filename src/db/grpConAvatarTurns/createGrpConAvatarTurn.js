// src/db/grpConAvatarTurn/createAvatarTurn.js
import { pool } from '../connection.js';

const VECTOR_DIM = 1536;

function normalizeVector(arr) {
  if (!Array.isArray(arr)) throw new TypeError('contentVector must be an array');
  if (arr.length === VECTOR_DIM) return arr;
  if (arr.length > VECTOR_DIM) return arr.slice(0, VECTOR_DIM);
  return arr.concat(new Array(VECTOR_DIM - arr.length).fill(0));
}

function toVectorLiteral(arr) {
  return `[${arr.join(',')}]`;
}

export async function createGrpConAvatarTurn(conversationId, avatarId, turnIndex, contentText, contentVector) {
  const normalized = normalizeVector(contentVector);
  const vecLit     = toVectorLiteral(normalized);
  const defaultTurnKindId = 1;

  const query = `
    INSERT INTO public.grp_con_avatar_turns
      (grp_con_id, turn_kind_id, avatar_id, turn_index, content_text, content_vector)
    VALUES ($1, $2, $3, $4, $5, $6::vector)
    RETURNING id, grp_con_id, avatar_id, turn_index, content_text, content_vector, created_at
  `;
  const { rows } = await pool.query(query, [
    conversationId,
    defaultTurnKindId,
    avatarId,
    turnIndex,
    contentText,
    vecLit,
  ]);
  const row = rows[0];
  row.content_vector = normalized;
  return row;
}
