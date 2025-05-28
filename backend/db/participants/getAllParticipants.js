/**
 * @file src/db/participant/getAllParticipants.js
 * @description Retrieves all participant records from the database.
 */
import { createDbError, DB_ERROR_CODES } from '../utils/index.js';

/**
 * Retrieves all participants from the database
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<object[]>} Array of participant records
 * @throws {Error} If a database error occurs
 */
export async function getAllParticipants(pool) {
  try {
    const query = `
      SELECT * FROM participants
      ORDER BY id
    `;

    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error getting all participants:', {
      error: error.message,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'getAllParticipants' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('Participants table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { operation: 'getAllParticipants' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to retrieve participants', {
      code: 'DB_QUERY_ERROR',
      status: 500,
      context: { operation: 'getAllParticipants' },
      cause: error
    });
  }
}