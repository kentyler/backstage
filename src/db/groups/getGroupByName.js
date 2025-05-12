// src/db/group/getGroupByName.js
/** 
 * @file src/db/group/getGroupByName.js
 * @description Retrieves a group record from the database by its name.
 */


/**
 * Retrieves a single group by its name.
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @param {string} name - The name of the group to retrieve.
 * @returns {Promise<{id: number, name: string, created_at: string}|null>} The group record, or null if not found.
 */
export async function getGroupByName(name, pool) {
  const query = `
    SELECT id, name, created_at
    FROM groups
    WHERE name = $1
  `;
  const result = await pool.query(query, [name]);
  return result.rows[0] || null;
}