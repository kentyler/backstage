/**
 * @file src/db/preferences/getCurrentParticipantTopic.js
 * @description Retrieves the most recent topic a participant has viewed.
 */
import { createDbError, DB_ERROR_CODES } from '../utils/index.js';

/**
 * Gets the most recent topic preference for a participant
 * @param {number} participantId - The ID of the participant
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<object|null>} The current topic preference or null if none exists
 * @throws {Error} If an error occurs during retrieval
 */
export async function getCurrentParticipantTopic(participantId, pool) {
  try {
    // Topic preference type ID is 4
    const preferenceTypeId = 4;
    
    // Get the most recent topic preference by created_at timestamp
    // Using the new numeric ID structure for joining with topic_paths
    const query = `
      SELECT pp.*, tp.path, tp.id as topic_id, tp.index as topic_index
      FROM participant_preferences pp
      JOIN topic_paths tp ON tp.id = pp.value::bigint
      WHERE pp.participant_id = $1 
      AND pp.preference_type_id = $2
      ORDER BY pp.created_at DESC
      LIMIT 1
    `;
    const values = [participantId, preferenceTypeId];

    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  } catch (error) {
    console.error('Error in getCurrentParticipantTopic:', {
      error: error.message,
      participantId,
      stack: error.stack
    });
    
    // If it's already a database error, just add additional context
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'getCurrentParticipantTopic' };
      throw error;
    }
    
    // Handle specific PostgreSQL errors
    if (error.code === '42P01') { // Relation does not exist
      throw createDbError('Required database table not found', {
        code: 'DB_RELATION_NOT_FOUND',
        status: 500,
        context: { participantId, operation: 'getCurrentParticipantTopic' },
        cause: error
      });
    }
    
    // For other errors, wrap with standard error
    throw createDbError('Failed to get current topic preference', {
      code: 'DB_QUERY_ERROR',
      status: 500,
      context: { participantId, operation: 'getCurrentParticipantTopic' },
      cause: error
    });
  }
}

export default getCurrentParticipantTopic;
