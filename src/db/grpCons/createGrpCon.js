// src/db/grpCons/createGrpCon.js
import { pool } from '../connection.js';

/**
 * Creates a new conversation under a group.
 * @param {number} groupId - The ID of the group.
 * @param {string} name - The conversation name.
 * @param {string} description - The conversation description.
 * @returns {Promise<{id: number, group_id: number, name: string, description: string, created_at: string}>}
 */
export async function createGrpCon(groupId, name, description) {
  const query = `
    INSERT INTO public.grp_cons (group_id, name, description)
    VALUES ($1, $2, $3)
    RETURNING id, group_id, name, description, created_at
  `;
  const result = await pool.query(query, [groupId, name, description]);
  return result.rows[0];
}