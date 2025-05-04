/**
 * @file src/db/preferences/getAllPreferenceTypes.js
 * @description Retrieves all preference types from the database.
 */

import { pool } from '../connection.js';

/**
 * Retrieves all preference types
 * @param {object} [customPool=pool] - Database connection pool (for testing)
 * @returns {Promise<Array>} Array of preference types
 * @throws {Error} If an error occurs during retrieval
 */
export async function getAllPreferenceTypes(customPool = pool) {
  try {
    const query = `
      SELECT id, name, description, created_at, updated_at
      FROM preference_types
      ORDER BY name
    `;

    const { rows } = await customPool.query(query);
    return rows;
  } catch (error) {
    throw new Error(`Failed to get all preference types: ${error.message}`);
  }
}

export default getAllPreferenceTypes;