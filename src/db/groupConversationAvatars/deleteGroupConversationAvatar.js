// src/db/groupConversationAvatars/deleteGroupConversationAvatar.js
/**
 * @file src/db/groupConversationAvatars/deleteGroupConversationAvatar.js
 * @description Removes an avatar from a conversation.
 */
import { pool } from '../connection.js';

/**
 * Deletes the link between an avatar and a conversation.
 *
 * @param {number} conversationId
 * @param {number} avatarId
 * @returns {Promise<boolean>} true if deleted, false otherwise
 */
export async function deleteGroupConversationAvatar(conversationId, avatarId) {
  const query = `
    DELETE FROM public.group_conversation_avatars
    WHERE group_conversation_id = $1
      AND avatar_id = $2
  `;
  const result = await pool.query(query, [conversationId, avatarId]);
  return result.rowCount > 0;
}
