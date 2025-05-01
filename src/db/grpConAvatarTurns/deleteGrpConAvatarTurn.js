// src/db/grpConAvatarTurn/deleteAvatarTurn.js
import { pool } from '../connection.js';

export async function deleteGrpConAvatarTurn(id) {
  const query = `
    DELETE FROM public.grp_con_avatar_turns
     WHERE id = $1
  `;
  const { rowCount } = await pool.query(query, [id]);
  return rowCount > 0;
}
