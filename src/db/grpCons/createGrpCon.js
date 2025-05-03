// src/db/grpCons/createGrpCon.js
import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Creates a new conversation under a group.
 * @param {number} groupId - The ID of the group.
 * @param {string} name - The conversation name.
 * @param {string} description - The conversation description.
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<{id: number, group_id: number, name: string, description: string, created_at: string}>}
 */
export async function createGrpCon(groupId, name, description, customPoolOrSchema = null) {
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
    INSERT INTO grp_cons (group_id, name, description)
    VALUES ($1, $2, $3)
    RETURNING id, group_id, name, description, created_at
  `;
  const result = await customPool.query(query, [groupId, name, description]);
  return result.rows[0];
}