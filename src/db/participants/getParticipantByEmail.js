/**
 * @file src/db/participant/getParticipantByEmail.js
 * @description Retrieves a participant record from the database by email address.
 */

/**
 * The database connection pool
 */
import { pool as defaultPool } from '../connection.js';

/**
 * Retrieves a participant by their email address
 * @param {string} email - The email of the participant to retrieve
 * @param {object} [pool=defaultPool] - Database connection pool (for testing)
 * @returns {Promise<object|null>} The participant record, or null if not found
 * @throws {Error} If a database error occurs
 */
export async function getParticipantByEmail(email, pool = defaultPool) {
  try {
    const query = `
      SELECT * FROM public.participants
      WHERE email = $1
    `;
    const values = [email];

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Failed to get participant by email: ${error.message}`);
  }
}