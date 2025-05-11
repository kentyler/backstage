/**
 * @file src/db/preferences/getPreferenceTypeByName.js
 * @description Retrieves a preference type by its name from the database.
 */

import { pool } from '../connection.js';

/**
 * Retrieves a preference type by its name
 * @param {string} name - The unique name of the preference type
 * * @returns {Promise<object|null>} The preference type or null if not found
 * @throws {Error} If an error occurs during retrieval
 */
export async function getPreferenceTypeByName(name) {
 
  try {
    const query = `
      SELECT id, name, description, created_at, updated_at
      FROM preference_types
      WHERE name = $1
      LIMIT 1
    `;
    const values = [name];

    const { rows } = await pool.query(query, values);
    return rows.length ? rows[0] : null;
  } catch (error) {
    throw new Error(`Failed to get preference type by name: ${error.message}`);
  }
}

export default getPreferenceTypeByName;