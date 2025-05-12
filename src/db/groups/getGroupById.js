// src/db/group/getGroupById.js
/**
 * @file src/db/group/getGroupById.js
 * @description Retrieves a group record from the database by its ID.
 */



/**
 * Retrieves a single group by its ID.
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @param {number} id - The ID of the group to retrieve.
 * @returns {Promise<{id: number, name: string, created_at: string}|null>} The group record, or null if not found.
 */
export async function getGroupById(id, pool) {
  const query = `
    SELECT id, name, created_at
    FROM groups
    WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}
