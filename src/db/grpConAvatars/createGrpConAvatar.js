// src/db/grpConAvatars/createGrpConAvatar.js
/**
 * @file src/db/grpConAvatars/createGrpConAvatar.js
 * @description Adds an avatar to a group conversation.
 */
import { pool } from '../connection.js';

/**
 * Inserts a new row into grp_con_avatars.
 *
 * @param {number} conversationId
 * @param {number} avatarId
 * @returns {Promise<{grp_con_id: number, avatar_id: number, added_at: string}>}
 */
export async function createGrpConAvatar(conversationId, avatarId) {
  const query = `
    INSERT INTO public.grp_con_avatars
      (grp_con_id, avatar_id)
    VALUES ($1, $2)
    RETURNING grp_con_id, avatar_id, added_at
  `;
  const { rows } = await pool.query(query, [conversationId, avatarId]);
  return rows[0];
}