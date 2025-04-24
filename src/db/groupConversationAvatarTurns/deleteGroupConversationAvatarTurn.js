// src/db/groupConversationAvatarTurn/deleteAvatarTurn.js
import { pool } from '../connection.js';

export async function deleteGroupConversationAvatarTurn(id) {
  const query = `
    DELETE FROM public.group_conversation_avatar_turns
     WHERE id = $1
  `;
  const { rowCount } = await pool.query(query, [id]);
  return rowCount > 0;
}
