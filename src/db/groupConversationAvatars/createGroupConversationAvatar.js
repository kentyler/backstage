// src/db/groupConversationAvatars/createGroupConversationAvatar.js
/**
 * @file src/db/groupConversationAvatars/createGroupConversationAvatar.js
 * @description Adds an avatar to a group conversation.
 */
import { pool } from '../connection.js';

/**
 * Inserts a new row into group_conversation_avatars.
 *
 * @param {number} conversationId
 * @param {number} avatarId
 * @returns {Promise<{group_conversation_id: number, avatar_id: number, added_at: string}>}
 */
export async function createGroupConversationAvatar(conversationId, avatarId) {
  const query = `
    INSERT INTO public.group_conversation_avatars
      (group_conversation_id, avatar_id)
    VALUES ($1, $2)
    RETURNING group_conversation_id, avatar_id, added_at
  `;
  const { rows } = await pool.query(query, [conversationId, avatarId]);
  return rows[0];
}
