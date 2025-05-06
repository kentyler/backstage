// src/db/grpCons/createGrpCon.js
import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Creates a new conversation under a group.
 * @param {number} groupId - The ID of the group.
 * @param {string} name - The conversation name.
 * @param {string} description - The conversation description.
 * @param {number} [typeId=1] - The type ID from grp_con_types table (1=conversation, 2=course)
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}>}
 */
export async function createGrpCon(groupId, name, description, typeId = 1, customPoolOrSchema = null) {
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
    INSERT INTO grp_cons (group_id, name, description, type_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id, group_id, name, description, type_id, created_at
  `;
  const result = await customPool.query(query, [groupId, name, description, typeId]);
  return result.rows[0];
}