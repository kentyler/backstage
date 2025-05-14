// src/db/group/getAllGroups.js
/**

 * @file src/db/group/getAllGroups.js
 * @description Retrieves all group records from the database.
 */


/**
 * Retrieves all groups from the database.
 * @returns {Promise<Array<{id: number, name: string, created_at: string}>>} Array of group records.
 * @param { Pool } pool - The PostgreSQL connection pool.
 */
export async function getAllGroups(pool) {
  const query = `
    SELECT id, name, created_at
    FROM groups
    ORDER BY id
  `;
  
  const result = await pool.query(query);
  return result.rows;
}