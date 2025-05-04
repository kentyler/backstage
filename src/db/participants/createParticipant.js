/**
 * @file src/db/participant/createParticipant.js
 * @description Creates a new participant record in the database.
 */

/**
 * The database connection pool
 */
import { pool as defaultPool } from '../connection.js';

/**
 * Creates a new participant in the database
 * @param {string} name - The name of the participant
 * @param {string} email - The email of the participant (must be unique)
 * @param {string} password - The hashed password for the participant
 * @param {object} [pool=defaultPool] - Database connection pool (for testing)
 * @returns {Promise<object>} The newly created participant record
 * @throws {Error} If email already exists or another error occurs
 */
export async function createParticipant(name, email, password, pool = defaultPool) {
  try {
    // Check if email already exists
    const existingEmail = await pool.query(
      'SELECT id FROM participants WHERE email = $1',
      [email]
    );

    if (existingEmail.rows.length > 0) {
      throw new Error(`Participant with email ${email} already exists`);
    }

    // Insert new participant
    const query = `
      INSERT INTO participants (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [name, email, password];

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    // Rethrow with a more informative message
    throw new Error(`Failed to create participant: ${error.message}`);
  }
}