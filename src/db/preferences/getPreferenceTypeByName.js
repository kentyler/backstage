/**
 * @file src/db/preferences/getPreferenceTypeByName.js
 * @description Retrieves a preference type by its name from the database.
 */

import { pool as defaultPool, createPool } from '../connection.js';

/**
 * Retrieves a preference type by its name
 * @param {string} name - The unique name of the preference type
 * @param {object|string} [customPoolOrSchema=defaultPool] - Database connection pool or schema name
 * @returns {Promise<object|null>} The preference type or null if not found
 * @throws {Error} If an error occurs during retrieval
 */
export async function getPreferenceTypeByName(name, customPoolOrSchema = defaultPool) {
  // Determine if the second parameter is a pool or a schema name
  let clientPool;
  if (typeof customPoolOrSchema === 'string') {
    // It's a schema name
    clientPool = customPoolOrSchema === 'public' ? defaultPool : createPool(customPoolOrSchema);
  } else {
    // It's a pool
    clientPool = customPoolOrSchema;
  }
  try {
    const query = `
      SELECT id, name, description, created_at, updated_at
      FROM public.preference_types
      WHERE name = $1
    `;
    const values = [name];

    const { rows } = await clientPool.query(query, values);
    return rows.length ? rows[0] : null;
  } catch (error) {
    throw new Error(`Failed to get preference type by name: ${error.message}`);
  }
}

export default getPreferenceTypeByName;