/**
 * @file src/db/participant/getParticipantById.js
 * @description Retrieves a participant record from the database by its ID.
 */

/**
 * The database connection pool and pool factory
 */
import { pool as defaultPool, createPool } from '../connection.js';

/**
 * Retrieves a participant by their ID
 * @param {number} id - The ID of the participant to retrieve
 * @param {string} [schema='public'] - The database schema to use
 * @param {object} [pool=null] - Database connection pool (for testing)
 * @returns {Promise<object|null>} The participant record, or null if not found
 * @throws {Error} If a database error occurs
 */
export async function getParticipantById(id, schema = 'public', pool = null) {
  // If no pool is provided, create one for the specified schema
  const clientPool = pool || (schema === 'public' ? defaultPool : createPool(schema));
  try {
    const query = `
      SELECT * FROM participants
      WHERE id = $1
    `;
    const values = [id];

    const result = await clientPool.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Failed to get participant by ID: ${error.message}`);
  }
}