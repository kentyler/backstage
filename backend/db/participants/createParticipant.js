/**
 * @file src/db/participant/createParticipant.js
 * @description Creates a new participant record in the database with hashed password.
 */

import { hashPassword } from '../../utils/passwordUtils.js';

/**
 * The database connection pool
 */

/**
 * Creates a new participant in the database
 * @param {string} name - The name of the participant
 * @param {string} email - The email of the participant (must be unique)
 * @param {string} password - The hashed password for the participant
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<object>} The newly created participant record
 * @throws {Error} If email already exists or another error occurs
 */
export async function createParticipant(name, email, password, pool) {
  try {
    // Check if email already exists
    const existingEmail = await pool.query(
      'SELECT id FROM participants WHERE email = $1',
      [email]
    );

    if (existingEmail.rows.length > 0) {
      throw new Error(`Participant with email ${email} already exists`);
    }
    
    // Hash the password before storing
    const hashedPassword = await hashPassword(password);
    
    // Insert new participant
    const query = `
      INSERT INTO participants (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [name, email, hashedPassword];

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    // Rethrow with a more informative message
    throw new Error(`Failed to create participant: ${error.message}`);
  }
}