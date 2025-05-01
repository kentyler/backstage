// src/db/grpCons/getGrpConsByGroup.js
import { pool } from '../connection.js';

/**
 * Retrieves conversations for a given group, ordered by creation date (newest first) and limited to 50.
 * @param {number} groupId - The group ID.
 * @returns {Promise<Array<{id: number, group_id: number, name: string, description: string, created_at: string}>>}
 */
export async function getGrpConsByGroup(groupId) {
  const query = `
    SELECT id, group_id, name, description, created_at
      FROM public.grp_cons
     WHERE group_id = $1
  ORDER BY created_at DESC
     LIMIT 50
  `;
  const result = await pool.query(query, [groupId]);
  return result.rows;
}