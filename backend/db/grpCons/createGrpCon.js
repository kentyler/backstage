// src/db/grpCons/createGrpCon.js

/**
 * Creates a new conversation under a group.
 * @param {number} groupId - The ID of the group.
 * @param {string} name - The conversation name.
 * @param {string} description - The conversation description.
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @param {number} [typeId=1] - The type ID from grp_con_types table (1=conversation, 2=template)
 * @returns {Promise<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}>}
 */
export async function createGrpCon(groupId, name, description, typeId = 1, pool) {
  const query = `
    INSERT INTO grp_cons (group_id, name, description, type_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id, group_id, name, description, type_id, created_at
  `;
  const result = await pool.query(query, [groupId, name, description, typeId]);
  return result.rows[0];
}