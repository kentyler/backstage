// src/db/groupConversationAvatarTurn/getAvatarTurnsByConversation.js
import { pool } from '../connection.js';

export async function getGroupConversationAvatarTurnsByConversation(conversationId) {
  const query = `
    SELECT id, group_conversation_id, avatar_id, turn_index, content_text, content_vector, created_at
      FROM public.group_conversation_avatar_turns
     WHERE group_conversation_id = $1
  ORDER BY turn_index
  `;
  const { rows } = await pool.query(query, [conversationId]);
  return rows;
}
