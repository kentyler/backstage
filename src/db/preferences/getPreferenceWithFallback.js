/**
 * @file src/db/preferences/getPreferenceWithFallback.js
 * @description Retrieves a preference with fallback hierarchy (participant -> group -> site -> default).
 */

import { getPreferenceTypeByName } from './getPreferenceTypeByName.js';

/**
 * Retrieves a preference with fallback hierarchy
 * @param {string} preferenceName - The name of the preference type

 * @param {number} participantId - The ID of the participant (optional)
 * 
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<object>} The preference value with source information
 * @throws {Error} If an error occurs during retrieval or preference type doesn't exist
 */
export async function getPreferenceWithFallback(preferenceName, participantId, pool) {
 
    
  try {
    // Get the preference type
    const preferenceType = await getPreferenceTypeByName(preferenceName, pool);
    if (!preferenceType) {
      throw new Error(`Preference type '${preferenceName}' not found`);
    }

    // Check for participant preference if participantId is provided
    if (participantId) {
      const participantPreferenceQuery = `
        SELECT value
        FROM participant_preferences
        WHERE participant_id = $1 AND preference_type_id = $2
        ORDER BY updated_at DESC
        LIMIT 1
      `;
      const participantPreferenceValues = [participantId, preferenceType.id];
      const participantPreferenceResult = await pool.query(
        participantPreferenceQuery, 
        participantPreferenceValues
      );
      
      if (participantPreferenceResult.rows.length > 0) {
        return {
          value: participantPreferenceResult.rows[0].value,
          source: 'participant',
          sourceId: participantId
        };
      }
    }

        // Check for site preference
    const sitePreferenceQuery = `
      SELECT value
      FROM site_preferences
      WHERE preference_type_id = $1
    `;
    const sitePreferenceValues = [preferenceType.id];
    const sitePreferenceResult = await pool.query(
      sitePreferenceQuery, 
      sitePreferenceValues
    );
    
    if (sitePreferenceResult.rows.length > 0) {
      return {
        value: sitePreferenceResult.rows[0].value,
        source: 'site'
      };
    }

    // Since there's no default_value column in preference_types table,
    // return a hardcoded default value based on preference name
    let defaultValue = null;
    
    // Set default values for known preference types
    if (preferenceName === 'llm_selection') {
      defaultValue = 1; // Default to LLM ID 1
    } else if (preferenceName === 'avatar_id') {
      defaultValue = 1; // Default to avatar ID 1
    } else if (preferenceName === 'group_id') {
      defaultValue = null; // No default group
    }
    
    return {
      value: defaultValue,
      source: 'default'
    };
  } catch (error) {
    throw new Error(`Failed to get preference with fallback: ${error.message}`);
  }
}

export default getPreferenceWithFallback;