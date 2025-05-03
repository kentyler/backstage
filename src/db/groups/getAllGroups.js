// src/db/group/getAllGroups.js
/**
 * @file src/db/group/getAllGroups.js
 * @description Retrieves all group records from the database.
 */

import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Retrieves all groups from the database.
 *
 * @param {string} [schema=null] - The schema to use for database operations (optional)
 * @returns {Promise<Array<{id: number, name: string, created_at: string}>>} Array of group records.
 */
export async function getAllGroups(schema = null) {
  // Use a schema-specific pool if a schema is provided
  const schemaPool = schema ? createPool(schema) : pool;
  
  const query = `
    SELECT id, name, created_at
    FROM groups
    ORDER BY id
  `;
  
  const result = await schemaPool.query(query);
  return result.rows;
}