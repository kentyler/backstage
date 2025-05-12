// src/db/grpCons/updateGrpCon.js

/**
 * Updates a conversation's name, description, and optionally its type.
 * @param {number} id - The conversation ID.
 * @param {string} newName - The new conversation name.
 * @param {string} newDescription - The new conversation description.
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @param {number|null} [newTypeId=null] - The new type ID from grp_con_types table (1=conversation, 2=template), or null to keep current type
 * @returns {Promise<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}|null>}
 */
export async function updateGrpCon(id, newName, newDescription, newTypeId = null, pool) {
  const query = `
    UPDATE grp_cons
    SET name = $2, description = $3${newTypeId ? ', type_id = $4' : ''}
    WHERE id = $1
    RETURNING id, group_id, name, description, type_id, created_at
  `;
  const result = await pool.query(query, newTypeId ? [id, newName, newDescription, newTypeId] : [id, newName, newDescription]);
  return result.rows[0] || null;
}