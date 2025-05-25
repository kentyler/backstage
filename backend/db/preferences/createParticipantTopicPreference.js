/**
 * @file src/db/preferences/createParticipantTopicPreference.js
 * @description Records a new entry in the participant's topic viewing history.
 */

import { logError, ERROR_SEVERITY, ERROR_SOURCE } from '../../services/errorLogger.js';

/**
 * Creates a new topic history entry for a participant
 * Each time a participant selects a topic, a new record is created
 * (rather than updating an existing record)
 * 
 * @param {number} participantId - The ID of the participant
 * @param {number} topicId - The numeric ID of the selected topic
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<object>} The newly created participant preference
 * @throws {Error} If an error occurs during creation
 */
export async function createParticipantTopicPreference(participantId, topicId, pool) {
  try {
    // Validate inputs
    if (!participantId) {
      throw new Error('Participant ID is required');
    }
    
    if (!topicId) {
      throw new Error('Topic ID is required');
    }
    
    if (!pool) {
      throw new Error('Database pool is required');
    }
    
    // Topic preference type ID is 4
    const preferenceTypeId = 4;
    
    // Always create a new record to maintain history
    const query = `
      INSERT INTO participant_preferences
        (participant_id, preference_type_id, value, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, participant_id, preference_type_id, value, created_at, updated_at
    `;
    const values = [participantId, preferenceTypeId, topicId];

    const result = await pool.query(query, values);
    
    if (!result.rows || result.rows.length === 0) {
      throw new Error('No rows returned after insert');
    }
    
    return result.rows[0];
  } catch (error) {
    // Log the error with our structured logging system
    await logError(
      error,
      {
        context: 'createParticipantTopicPreference',
        severity: ERROR_SEVERITY.ERROR,
        source: ERROR_SOURCE.DATABASE,
        metadata: { participantId, topicId, preferenceTypeId: 4 }
      },
      null,
      pool
    );
    
    throw new Error(`Failed to record topic history: ${error.message}`);
  }
}

export default createParticipantTopicPreference;
