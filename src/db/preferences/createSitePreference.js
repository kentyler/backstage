/**
 * @file src/db/preferences/createSitePreference.js
 * @description Creates or updates a site-wide preference in the database.
 */

import { pool } from '../connection.js';

/**
 * Creates or updates a site-wide preference
 * @param {number} preferenceTypeId - The ID of the preference type
 * @param {object} value - The JSON value for the preference
 * @param {object} [customPool=pool] - Database connection pool (for testing)
 * @returns {Promise<object>} The newly created or updated site preference
 * @throws {Error} If an error occurs during creation/update
 */
export async function createSitePreference(preferenceTypeId, value, customPool = pool) {
  try {
    // Use upsert (INSERT ... ON CONFLICT ... DO UPDATE) to handle both creation and update
    const query = `
      INSERT INTO public.site_preferences
        (preference_type_id, value, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (preference_type_id) 
      DO UPDATE SET 
        value = $2,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, preference_type_id, value, created_at, updated_at
    `;
    const values = [preferenceTypeId, value];

    const { rows } = await customPool.query(query, values);
    return rows[0];
  } catch (error) {
    throw new Error(`Failed to create/update site preference: ${error.message}`);
  }
}

export default createSitePreference;