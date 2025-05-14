// src/db/group/createGroup.js
/**
 * @file src/db/group/createGroup.js
 * @description Creates a new group record in the database.
 */

/**
 * Creates a new group with the given name.
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @param {string} name - The name of the group.
 * @returns {Promise<{id: number, name: string, created_at: string}>} The newly created group record.
 */
export async function createGroup(name, pool) {
  const query = `
    INSERT INTO groups (name)
    VALUES ($1)
    RETURNING id, name, created_at
  `;
  const result = await pool.query(query, [name]);
  return result.rows[0];
}