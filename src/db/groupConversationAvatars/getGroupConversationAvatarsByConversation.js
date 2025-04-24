// src/db/groupConversationAvatars/getAvatarsByConversation.js
/**
 * @file src/db/groupConversationAvatars/getAvatarsByConversation.js
 * @description Lists all avatars in a given conversation.
 */
import { pool } from '../connection.js';

/**
 * Fetches avatar entries for one conversation.
 *
 * @param {number} conversationId
 * @returns {Promise<Array<{avatar_id: number, added_at: string}>>}
 */
export async function getGroupConversationAvatarsByConversation(conversationId) {
  const query = `
    SELECT avatar_id, added_at
    FROM public.group_conversation_avatars
    WHERE group_conversation_id = $1
    ORDER BY added_at
  `;
  const { rows } = await pool.query(query, [conversationId]);
  return rows;
}
