/**
 * @file src/db/participant/createParticipant.js
 * @description Creates a new participant record in the database with hashed password.
 */

import { hashPassword } from '../../utils/passwordUtils.js';
import { createDbError, DB_ERROR_CODES } from '../utils/index.js';

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
      throw createDbError(`Participant with email ${email} already exists`, {
        code: 'DUPLICATE_EMAIL',
        status: 409, // Conflict
        context: { email }
      });
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
    console.error('Error creating participant:', {
      error: error.message,
      email,
      name,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'createParticipant' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '23505') { // Unique violation
      throw createDbError(`Participant with email ${email} already exists`, {
        code: 'DUPLICATE_EMAIL',
        status: 409, // Conflict
        context: { email, operation: 'createParticipant' },
        cause: error
      });
    }
    
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('Participants table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { operation: 'createParticipant' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to create participant', {
      code: 'DB_OPERATION_FAILED',
      status: 500,
      context: { email, name, operation: 'createParticipant' },
      cause: error
    });
  }
}