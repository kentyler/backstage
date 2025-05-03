/**
 * @file src/db/preferences/createParticipantPreference.js
 * @description Creates or updates a participant preference in the database.
 */

import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Creates or updates a participant preference
 * @param {number} participantId - The ID of the participant
 * @param {number} preferenceTypeId - The ID of the preference type
 * @param {object} value - The JSON value for the preference
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<object>} The newly created or updated participant preference
 * @throws {Error} If an error occurs during creation/update
 */
export async function createParticipantPreference(participantId, preferenceTypeId, value, customPoolOrSchema = null) {
  try {
    // Determine which pool to use
    let queryPool = pool;
    
    if (customPoolOrSchema) {
      if (typeof customPoolOrSchema === 'string') {
        // If a schema name is provided, create a pool for that schema
        queryPool = createPool(customPoolOrSchema);
      } else {
        // If a pool object is provided, use it
        queryPool = customPoolOrSchema;
      }
    } else {
      // Use default schema if no schema or pool is provided
      const defaultSchema = getDefaultSchema();
      if (defaultSchema !== 'public') {
        queryPool = createPool(defaultSchema);
      }
    }
    
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

    const { rows } = await queryPool.query(query, values);
    return rows[0];
  } catch (error) {
    throw new Error(`Failed to create/update participant preference: ${error.message}`);
  }
}

export default createParticipantPreference;