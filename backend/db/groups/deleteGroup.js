// src/db/group/deleteGroup.js
/**
 * @file src/db/group/deleteGroup.js
 * @description Deletes a group by its ID.
 */



/**
 * Deletes a group from the database.
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @param {number} groupId - The ID of the group to delete.
 * @returns {Promise<boolean>} True if a group was deleted, false otherwise.
 */
export async function deleteGroup(groupId, pool) {
  const query = `
    DELETE FROM groups
    WHERE id = $1
  `;
  const result = await pool.query(query, [groupId]);
  return result.rowCount > 0;
}
