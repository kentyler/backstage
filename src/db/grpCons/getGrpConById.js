// src/db/grpCons/getGrpConById.js
import { pool } from '../connection.js';

/**
 * Retrieves a conversation by its ID.
 * @param {number} id - The conversation ID.
 * @returns {Promise<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}|null>}
 */
export async function getGrpConById(id) {
  const query = `
    SELECT id, group_id, name, description, type_id, created_at
    FROM grp_cons
    WHERE id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}