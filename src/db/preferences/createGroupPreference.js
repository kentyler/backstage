/**
 * @file src/db/preferences/createGroupPreference.js
 * @description Creates or updates a group preference in the database.
 */

/**
 * Creates or updates a group preference
 * @param {number} groupId - The ID of the group
 * @param {number} preferenceTypeId - The ID of the preference type
 * @param {number} value - The BIGINT value for the preference
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @returns {Promise<object>} The newly created or updated group preference
 * @throws {Error} If an error occurs during creation/update
 */
export async function createGroupPreference(groupId, preferenceTypeId, value, pool) {
  try {
    // Use upsert (INSERT ... ON CONFLICT ... DO UPDATE) to handle both creation and update
    const query = `
      INSERT INTO group_preferences
        (group_id, preference_type_id, value, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (group_id, preference_type_id) 
      DO UPDATE SET 
        value = $3,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, group_id, preference_type_id, value, created_at, updated_at
    `;
    const values = [groupId, preferenceTypeId, value];

    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (error) {
    throw new Error(`Failed to create/update group preference: ${error.message}`);
  }
}

export default createGroupPreference;