// src/db/grpCons/getGrpConById.js
import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Retrieves a conversation by its ID.
 * @param {number} id - The conversation ID.
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<{id: number, group_id: number, name: string, description: string, created_at: string}|null>}
 */
export async function getGrpConById(id, customPoolOrSchema = null) {
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
     WHERE id = $1
  `;
  const result = await customPool.query(query, [id]);
  return result.rows[0] || null;
}