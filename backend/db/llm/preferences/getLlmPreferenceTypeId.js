/**
 * @file db/llm/preferences/getLlmPreferenceTypeId.js
 * @description Gets the preference type ID for LLM selection
 */

/**
 * Gets the preference type ID for LLM selection
 * @param {Object} pool - The database connection pool
 * @param {string} preferenceName - Name of the preference type (default: 'llm_selection')
 * @returns {Promise<number>} The preference type ID
 */
export async function getLlmPreferenceTypeId(pool, preferenceName = 'llm_selection') {
  try {
    const prefTypeQuery = `
      SELECT id, name FROM preference_types WHERE name = $1;
    `;
    
    const { rows } = await pool.query(prefTypeQuery, [preferenceName]);
    console.log(`Preference type check for ${preferenceName}:`, rows);
    
    if (!rows || rows.length === 0) {
      throw new Error(`${preferenceName} type not found in preference_types table`);
    }
    
    return rows[0].id;
  } catch (error) {
    console.error(`Error getting ${preferenceName} preference type ID:`, error);
    throw error;
  }
}
