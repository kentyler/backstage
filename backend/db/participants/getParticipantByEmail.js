/**
 * @file src/db/participant/getParticipantByEmail.js
 * @description Retrieves a participant record from the database by email address.
 */
import { createDbError, DB_ERROR_CODES } from '../utils/index.js';

/**
 * Retrieves a participant by their email address
 * @param {string} email - The email of the participant to retrieve
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<object|null>} The participant record, or null if not found
 * @throws {Error} If a database error occurs
 */
export async function getParticipantByEmail(email, pool) {
  try {
        
    const query = `
      SELECT * FROM participants
      WHERE email = $1
    `;
    const values = [email];

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting participant by email:', {
      error: error.message,
      email,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'getParticipantByEmail' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('Participants table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { email, operation: 'getParticipantByEmail' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to retrieve participant by email', {
      code: 'DB_QUERY_ERROR',
      status: 500,
      context: { email, operation: 'getParticipantByEmail' },
      cause: error
    });
  }
}