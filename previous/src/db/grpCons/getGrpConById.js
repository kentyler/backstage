// src/db/grpCons/getGrpConById.js

/**
 * Retrieves a conversation by its ID.
 * @param {number} id - The conversation ID.
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}|null>}
 */
export async function getGrpConById(id, pool) {
  const query = `
    SELECT id, group_id, name, description, type_id, created_at
    FROM grp_cons
    WHERE id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}