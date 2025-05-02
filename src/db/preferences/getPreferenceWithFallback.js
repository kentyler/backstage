/**
 * @file src/db/preferences/getPreferenceWithFallback.js
 * @description Retrieves a preference with fallback hierarchy (participant -> group -> site -> default).
 */

import { pool } from '../connection.js';
import { getPreferenceTypeByName } from './getPreferenceTypeByName.js';

/**
 * Retrieves a preference with fallback hierarchy
 * @param {string} preferenceName - The name of the preference type
 * @param {object} options - Options for preference retrieval
 * @param {number} [options.participantId] - The ID of the participant (optional)
 * @param {number} [options.groupId] - The ID of the group (optional)
 * @param {object} [options.customPool=pool] - Database connection pool (for testing)
 * @returns {Promise<object>} The preference value with source information
 * @throws {Error} If an error occurs during retrieval or preference type doesn't exist
 */
export async function getPreferenceWithFallback(preferenceName, options, customPool = pool) {
  const { participantId, groupId } = options;
  const customPoolToUse = options.customPool || pool;
  
  try {
    // Get the preference type
    const preferenceType = await getPreferenceTypeByName(preferenceName, customPoolToUse);
    if (!preferenceType) {
      throw new Error(`Preference type '${preferenceName}' not found`);
    }

    // Check for participant preference if participantId is provided
    if (participantId) {
      const participantPreferenceQuery = `
        SELECT value
        FROM public.participant_preferences
        WHERE participant_id = $1 AND preference_type_id = $2
      `;
      const participantPreferenceValues = [participantId, preferenceType.id];
      const participantPreferenceResult = await customPoolToUse.query(
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

    // Check for group preference if groupId is provided
    if (groupId) {
      const groupPreferenceQuery = `
        SELECT value
        FROM public.group_preferences
        WHERE group_id = $1 AND preference_type_id = $2
      `;
      const groupPreferenceValues = [groupId, preferenceType.id];
      const groupPreferenceResult = await customPoolToUse.query(
        groupPreferenceQuery, 
        groupPreferenceValues
      );
      
      if (groupPreferenceResult.rows.length > 0) {
        return {
          value: groupPreferenceResult.rows[0].value,
          source: 'group',
          sourceId: groupId
        };
      }
    }

    // Check for site preference
    const sitePreferenceQuery = `
      SELECT value
      FROM public.site_preferences
      WHERE preference_type_id = $1
    `;
    const sitePreferenceValues = [preferenceType.id];
    const sitePreferenceResult = await customPoolToUse.query(
      sitePreferenceQuery, 
      sitePreferenceValues
    );
    
    if (sitePreferenceResult.rows.length > 0) {
      return {
        value: sitePreferenceResult.rows[0].value,
        source: 'site'
      };
    }

    // Fall back to default value from preference type
    return {
      value: preferenceType.default_value,
      source: 'default'
    };
  } catch (error) {
    throw new Error(`Failed to get preference with fallback: ${error.message}`);
  }
}

export default getPreferenceWithFallback;