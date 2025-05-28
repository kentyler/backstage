/**
 * @file src/db/participant/deleteParticipant.js
 * @description Deletes a participant by ID from the database.
 */
import { createDbError, DB_ERROR_CODES } from '../utils/index.js';

/**
 * The database connection pool
 */

/**
 * Deletes a participant from the database
 * @param {number} id - The ID of the participant to delete
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<boolean>} True if a participant was deleted, false otherwise
 * @throws {Error} If a database error occurs
 */
export async function deleteParticipant(id, pool) {
  try {
    // Check if it's the test participant (ID: 1) - optional protection
    // if (id === 1) {
    //   throw new Error('Cannot delete the test participant (ID: 1)');
    // }

    const query = `
      DELETE FROM participants
      WHERE id = $1
    `;
    const values = [id];

    const result = await pool.query(query, values);
    
    // Check if any rows were affected by the delete operation
    if (result.rowCount === 0) {
      throw createDbError(`Participant with ID ${id} not found`, {
        code: 'PARTICIPANT_NOT_FOUND',
        status: 404,
        context: { participantId: id }
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting participant:', {
      error: error.message,
      participantId: id,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'deleteParticipant' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('Participants table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { participantId: id, operation: 'deleteParticipant' },
        cause: error
      });
    }
    
    if (error.code === '23503') { // Foreign key violation
      throw createDbError(`Cannot delete participant ID ${id} - it is referenced by other records`, {
        code: 'REFERENCE_CONSTRAINT',
        status: 400, // Bad request - can't delete with references
        context: { participantId: id, operation: 'deleteParticipant' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to delete participant', {
      code: 'DB_OPERATION_FAILED',
      status: 500,
      context: { participantId: id, operation: 'deleteParticipant' },
      cause: error
    });
  }
}