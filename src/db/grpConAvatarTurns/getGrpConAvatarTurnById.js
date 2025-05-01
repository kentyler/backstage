// src/db/grpConAvatarTurn/getGrpConAvatarTurnById.js
import { pool } from '../connection.js';

export async function getGrpConAvatarTurnById(id) {
  const query = `
    SELECT id, grp_con_id, avatar_id, turn_index, content_text, content_vector, created_at
      FROM public.grp_con_avatar_turns
     WHERE id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}
