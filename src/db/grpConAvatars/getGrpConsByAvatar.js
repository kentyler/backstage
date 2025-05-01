// src/db/grpConAvatars/getGrpConsByAvatar.js
/**
 * @file src/db/grpConAvatars/getGrpConsByAvatar.js
 * @description Lists all conversations that include a given avatar.
 */
import { pool } from '../connection.js';

/**
 * Fetches conversation entries for one avatar.
 *
 * @param {number} avatarId
 * @returns {Promise<Array<{grp_con_id: number, added_at: string}>>}
 */
export async function getGrpConsByAvatar(avatarId) {
  const query = `
    SELECT grp_con_id, added_at
    FROM public.grp_con_avatars
    WHERE avatar_id = $1
    ORDER BY added_at
  `;
  const { rows } = await pool.query(query, [avatarId]);
  return rows;
}