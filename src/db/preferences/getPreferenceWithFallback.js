/**
 * @file src/db/preferences/getPreferenceWithFallback.js
 * @description Retrieves a preference with fallback hierarchy (participant -> group -> site -> default).
 */

import { pool as defaultPool, createPool } from '../connection.js';
import { getPreferenceTypeByName } from './getPreferenceTypeByName.js';

/**
 * Retrieves a preference with fallback hierarchy
 * @param {string} preferenceName - The name of the preference type
 * @param {object} options - Options for preference retrieval
 * @param {number} [options.participantId] - The ID of the participant (optional)
 * @param {number} [options.groupId] - The ID of the group (optional)
 * @param {string} [options.schema='public'] - The database schema to use
 * @param {object} [options.customPool=null] - Database connection pool (for testing)
 * @returns {Promise<object>} The preference value with source information
 * @throws {Error} If an error occurs during retrieval or preference type doesn't exist
 */
export async function getPreferenceWithFallback(preferenceName, options, customPool = null) {
  const { participantId, groupId, schema = 'public' } = options;
  
  // If no pool is provided, create one for the specified schema
  const clientPool = customPool || options.customPool || 
    (schema === 'public' ? defaultPool : createPool(schema));
  
  try {
    // Get the preference type
    const preferenceType = await getPreferenceTypeByName(preferenceName, schema);
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
      const participantPreferenceResult = await clientPool.query(
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
        FROM group_preferences
        WHERE group_id = $1 AND preference_type_id = $2
      `;
      const groupPreferenceValues = [groupId, preferenceType.id];
      const groupPreferenceResult = await clientPool.query(
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
      FROM site_preferences
      WHERE preference_type_id = $1
    `;
    const sitePreferenceValues = [preferenceType.id];
    const sitePreferenceResult = await clientPool.query(
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