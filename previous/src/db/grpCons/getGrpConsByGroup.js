// src/db/grpCons/getGrpConsByGroup.js

/**
 * Retrieves conversations for a given group, ordered by creation date (newest first) and limited to 50.
 * Optionally filters by conversation type.
 * @param {number} groupId - The group ID.
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @param {number|null} [typeId=null] - The type ID to filter by (1=conversation, 2=template), or null for all types
 * @returns {Promise<Array<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}>>}
 */
export async function getGrpConsByGroup(groupId, typeId = null, pool) {
  const query = `
    SELECT id, group_id, name, description, type_id, created_at
    FROM grp_cons
    WHERE group_id = $1
    ${typeId ? 'AND type_id = $2' : ''}
    ORDER BY created_at DESC
    LIMIT 50
  `;
  const result = await pool.query(query, typeId ? [groupId, typeId] : [groupId]);
  return result.rows;
}