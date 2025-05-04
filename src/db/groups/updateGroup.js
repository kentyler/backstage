// src/db/group/updateGroup.js
/**
 * @file src/db/group/updateGroup.js
 * @description Updates a group's properties in the database.
 */

import { pool } from '../connection.js';

/**
 * Updates an existing group's properties.
 *
 * @param {number} groupId - The ID of the group to update.
 * @param {Object} updates - The properties to update.
 * @param {string} [updates.name] - The new name for the group.
 * @returns {Promise<{id: number, name: string, created_at: string}|null>} The updated group record, or null if not found.
 */
export async function updateGroup(groupId, updates = {}) {
  // Build the SET clause and values array dynamically based on provided updates
  const setClauses = [];
  const values = [groupId]; // First parameter is always the group ID
  
  if (updates.name !== undefined) {
    setClauses.push(`name = $${values.length + 1}`);
    values.push(updates.name);
  }
  
  // If no updates were provided, return null
  if (setClauses.length === 0) {
    return null;
  }
  
  const query = `
    UPDATE groups
    SET ${setClauses.join(', ')}
    WHERE id = $1
    RETURNING id, name, created_at
  `;
  const result = await pool.query(query, values);
  return result.rows[0] || null;
}