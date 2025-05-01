// src/db/grpConAvatars/getGrpConAvatarsByConversation.js
/**
 * @file src/db/grpConAvatars/getGrpConAvatarsByConversation.js
 * @description Lists all avatars in a given conversation.
 */
import { pool } from '../connection.js';

/**
 * Fetches avatar entries for one conversation.
 *
 * @param {number} conversationId
 * @returns {Promise<Array<{avatar_id: number, added_at: string}>>}
 */
export async function getGrpConAvatarsByConversation(conversationId) {
  const query = `
    SELECT avatar_id, added_at
    FROM public.grp_con_avatars
    WHERE grp_con_id = $1
    ORDER BY added_at
  `;
  const { rows } = await pool.query(query, [conversationId]);
  return rows;
}