/**
 * @file src/db/participant/getParticipantById.js
 * @description Retrieves a participant record from the database by its ID.
 */
import { createDbError, DB_ERROR_CODES } from '../utils/index.js';

/**
 * Retrieves a participant by their ID
 * @param {number} id - The ID of the participant to retrieve
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<object|null>} The participant record, or null if not found
 * @throws {Error} If a database error occurs
 */
export async function getParticipantById(id, pool) {

  try {
    const query = `
      SELECT * FROM participants
      WHERE id = $1
    `;
    const values = [id];

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting participant by ID:', {
      error: error.message,
      participantId: id,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'getParticipantById' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('Participants table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { participantId: id, operation: 'getParticipantById' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to get participant by ID', {
      code: 'DB_QUERY_ERROR',
      status: 500,
      context: { participantId: id, operation: 'getParticipantById' },
      cause: error
    });
  }
}