/**
 * @file src/db/preferences/createParticipantTopicPreference.js
 * @description Records a new entry in the participant's topic viewing history.
 */

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

    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (error) {
    throw new Error(`Failed to record topic history: ${error.message}`);
  }
}

export default createParticipantTopicPreference;
