/**
 * @file src/db/participant/getParticipantById.js
 * @description Retrieves a participant record from the database by its ID.
 */

/**
 * The database connection pool
 */
import { pool as defaultPool } from '../connection.js';

/**
 * Retrieves a participant by their ID
 * @param {number} id - The ID of the participant to retrieve
 * @param {object} [pool=defaultPool] - Database connection pool (for testing)
 * @returns {Promise<object|null>} The participant record, or null if not found
 * @throws {Error} If a database error occurs
 */
export async function getParticipantById(id, pool = defaultPool) {
  try {
    const query = `
      SELECT * FROM public.participants
      WHERE id = $1
    `;
    const values = [id];

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Failed to get participant by ID: ${error.message}`);
  }
}