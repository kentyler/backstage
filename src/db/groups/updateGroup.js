// src/db/group/updateGroup.js
/**
 * @file src/db/group/updateGroup.js
 * @description Updates a group's name in the database.
 */

import { pool } from '../connection.js';

/**
 * Updates the name of an existing group.
 *
 * @param {number} groupId - The ID of the group to update.
 * @param {string} newName - The new name for the group.
 * @returns {Promise<{id: number, name: string, created_at: string}|null>} The updated group record, or null if not found.
 */
export async function updateGroup(groupId, newName) {
  const query = `
    UPDATE public.groups
    SET name = $2
    WHERE id = $1
    RETURNING id, name, created_at
  `;
  const result = await pool.query(query, [groupId, newName]);
  return result.rows[0] || null;
}