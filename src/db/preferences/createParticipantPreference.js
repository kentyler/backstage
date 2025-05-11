/**
 * @file src/db/preferences/createParticipantPreference.js
 * @description Creates or updates a participant preference in the database.
 */

import { pool } from '../connection.js';



/**
 * Creates or updates a participant preference
 * @param {number} participantId - The ID of the participant
 * @param {number} preferenceTypeId - The ID of the preference type
 * @param {number} value - The BIGINT value for the preference
  * @returns {Promise<object>} The newly created or updated participant preference
 * @throws {Error} If an error occurs during creation/update
 */
export async function createParticipantPreference(participantId, preferenceTypeId, value) {
  try {
        
    // Use upsert (INSERT ... ON CONFLICT ... DO UPDATE) to handle both creation and update
    const query = `
      INSERT INTO participant_preferences
        (participant_id, preference_type_id, value, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (participant_id, preference_type_id) 
      DO UPDATE SET 
        value = $3,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, participant_id, preference_type_id, value, created_at, updated_at
    `;
    const values = [participantId, preferenceTypeId, value];

    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (error) {
    throw new Error(`Failed to create/update participant preference: ${error.message}`);
  }
}

export default createParticipantPreference;