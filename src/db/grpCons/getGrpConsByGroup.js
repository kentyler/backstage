// src/db/grpCons/getGrpConsByGroup.js
import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Retrieves conversations for a given group, ordered by creation date (newest first) and limited to 50.
 * @param {number} groupId - The group ID.
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<Array<{id: number, group_id: number, name: string, description: string, created_at: string}>>}
 */
export async function getGrpConsByGroup(groupId, customPoolOrSchema = null) {
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

  const query = `
    SELECT id, group_id, name, description, created_at
      FROM grp_cons
     WHERE group_id = $1
  ORDER BY created_at DESC
     LIMIT 50
  `;
  const result = await customPool.query(query, [groupId]);
  return result.rows;
}