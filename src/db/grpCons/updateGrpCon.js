// src/db/grpCons/updateGrpCon.js
import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Updates a conversation's name, description, and optionally its type.
 * @param {number} id - The conversation ID.
 * @param {string} newName - The new conversation name.
 * @param {string} newDescription - The new conversation description.
 * @param {number|null} [newTypeId=null] - The new type ID from grp_con_types table (1=conversation, 2=template), or null to keep current type
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}|null>}
 */
export async function updateGrpCon(id, newName, newDescription, newTypeId = null, customPoolOrSchema = null) {
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
  
  if (newTypeId !== null) {
    // If a new type ID is provided, update the type_id field as well
    query = `
      UPDATE grp_cons
         SET name = $2,
             description = $3,
             type_id = $4
       WHERE id = $1
       RETURNING id, group_id, name, description, type_id, created_at
    `;
    params = [id, newName, newDescription, newTypeId];
  } else {
    // Otherwise, only update name and description
    query = `
      UPDATE grp_cons
         SET name = $2,
             description = $3
       WHERE id = $1
       RETURNING id, group_id, name, description, type_id, created_at
    `;
    params = [id, newName, newDescription];
  }
  
  const result = await customPool.query(query, params);
  return result.rows[0] || null;
}