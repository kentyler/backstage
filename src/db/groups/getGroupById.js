// src/db/group/getGroupById.js
/**
 * @file src/db/group/getGroupById.js
 * @description Retrieves a group record from the database by its ID.
 */

import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Retrieves a single group by its ID.
 *
 * @param {number} id - The ID of the group to retrieve.
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<{id: number, name: string, created_at: string}|null>} The group record, or null if not found.
 */
export async function getGroupById(id, customPoolOrSchema = null) {
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
    SELECT id, name, created_at
    FROM groups
    WHERE id = $1
  `;
  const result = await customPool.query(query, [id]);
  return result.rows[0] || null;
}
