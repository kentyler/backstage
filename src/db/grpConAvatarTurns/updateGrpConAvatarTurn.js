// src/db/GrpConAvatarTurn/updateAvatarTurn.js
import { pool } from '../connection.js';

const VECTOR_DIM = 1536;
function normalizeVector(arr) { /* same as above */ }
function toVectorLiteral(arr) { /* same as above */ }

export async function updateGrpConAvatarTurn(id, newText, newVector) {
  const normalized = normalizeVector(newVector);
  const vecLit     = toVectorLiteral(normalized);
  const query = `
    UPDATE public.grp_con_avatar_turns
       SET content_text = $2,
           content_vector = $3::vector
     WHERE id = $1
     RETURNING id, grp_con_id, avatar_id, turn_index, content_text, content_vector, created_at
  `;
  const { rows } = await pool.query(query, [id, newText, vecLit]);
  const row = rows[0] || null;
  if (row) row.content_vector = normalized;
  return row;
}
