// src/db/grpCons/getGrpConsByGroup.js
import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Retrieves conversations for a given group, ordered by creation date (newest first) and limited to 50.
 * Optionally filters by conversation type.
 * @param {number} groupId - The group ID.
 * @param {number|null} [typeId=null] - The type ID to filter by (1=conversation, 2=course), or null for all types
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<Array<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}>>}
 */
export async function getGrpConsByGroup(groupId, typeId = null, customPoolOrSchema = null) {
  // Determine which pool to use
  let customPool = pool;
  
  if (customPoolOrSchema) {
    if (typeof customPoolOrSchema === 'string') {
      // If a schema name is provided, create a pool for that schema
      customPool = createPool(customPoolOrSchema);
    } else {
      // If a pool object is provided, use it
      customPool = customPoolOrSchema;
    }
  } else {
    // Use default schema if no schema or pool is provided
    const defaultSchema = getDefaultSchema();
    if (defaultSchema !== 'public') {
      customPool = createPool(defaultSchema);
    }
  }

  let query;
  let params;
  
  if (typeId !== null) {
    // If a type ID is provided, filter by both group_id and type_id
    query = `
      SELECT id, group_id, name, description, type_id, created_at
        FROM grp_cons
       WHERE group_id = $1 AND type_id = $2
    ORDER BY created_at DESC
       LIMIT 50
    `;
    params = [groupId, typeId];
  } else {
    // Otherwise, only filter by group_id
    query = `
      SELECT id, group_id, name, description, type_id, created_at
        FROM grp_cons
       WHERE group_id = $1
    ORDER BY created_at DESC
       LIMIT 50
    `;
    params = [groupId];
  }
  
  const result = await customPool.query(query, params);
  return result.rows;
}