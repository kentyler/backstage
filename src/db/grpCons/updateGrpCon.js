// src/db/grpCons/updateGrpCon.js
import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Updates a conversation's name and description.
 * @param {number} id - The conversation ID.
 * @param {string} newName - The new conversation name.
 * @param {string} newDescription - The new conversation description.
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<{id: number, group_id: number, name: string, description: string, created_at: string}|null>}
 */
export async function updateGrpCon(id, newName, newDescription, customPoolOrSchema = null) {
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
    UPDATE grp_cons
       SET name = $2,
           description = $3
     WHERE id = $1
     RETURNING id, group_id, name, description, created_at
  `;
  const result = await customPool.query(query, [id, newName, newDescription]);
  return result.rows[0] || null;
}