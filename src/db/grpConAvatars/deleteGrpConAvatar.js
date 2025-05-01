// src/db/grpConAvatars/deleteGrpConAvatar.js
/**
 * @file src/db/grpConAvatars/deleteGrpConAvatar.js
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
export async function deleteGrpConAvatar(conversationId, avatarId) {
  const query = `
    DELETE FROM public.grp_con_avatars
    WHERE grp_con_id = $1
      AND avatar_id = $2
  `;
  const result = await pool.query(query, [conversationId, avatarId]);
  return result.rowCount > 0;
}