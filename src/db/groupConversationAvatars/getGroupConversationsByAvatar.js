// src/db/groupConversationAvatars/getConversationsByAvatar.js
/**
 * @file src/db/groupConversationAvatars/getConversationsByAvatar.js
 * @description Lists all conversations that include a given avatar.
 */
import { pool } from '../connection.js';

/**
 * Fetches conversation entries for one avatar.
 *
 * @param {number} avatarId
 * @returns {Promise<Array<{group_conversation_id: number, added_at: string}>>}
 */
export async function getGroupConversationsByAvatar(avatarId) {
  const query = `
    SELECT group_conversation_id, added_at
    FROM public.group_conversation_avatars
    WHERE avatar_id = $1
    ORDER BY added_at
  `;
  const { rows } = await pool.query(query, [avatarId]);
  return rows;
}
