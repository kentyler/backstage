// src/db/groupConversationAvatarTurn/getAvatarTurnById.js
import { pool } from '../connection.js';

export async function getGroupConversationAvatarTurnById(id) {
  const query = `
    SELECT id, group_conversation_id, avatar_id, turn_index, content_text, content_vector, created_at
      FROM public.group_conversation_avatar_turns
     WHERE id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}
