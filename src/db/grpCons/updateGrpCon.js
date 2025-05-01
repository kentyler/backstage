// src/db/groupCon/updateGrpCon.js
import { pool } from '../connection.js';

/**
 * Updates a conversation's name and description.
 * @param {number} id - The conversation ID.
 * @param {string} newName - The new conversation name.
 * @param {string} newDescription - The new conversation description.
 * @returns {Promise<{id: number, group_id: number, name: string, description: string, created_at: string}|null>}
 */
export async function updateGrpCon(id, newName, newDescription) {
  const query = `
    UPDATE public.grp_cons
       SET name = $2,
           description = $3
     WHERE id = $1
     RETURNING id, group_id, name, description, created_at
  `;
  const result = await pool.query(query, [id, newName, newDescription]);
  return result.rows[0] || null;
}