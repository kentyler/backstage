/**
 * @file db/llm/utils/validation.js
 * @description Validation utilities for LLM database operations
 */

/**
 * Checks if the llm_config_view exists in the current schema
 * @param {Object} client - Database client
 * @returns {Promise<boolean>} Whether the view exists
 */
export const validateLlmConfigView = async (client) => {
  console.log('Checking if llm_config_view exists in current schema...');
  
  const viewCheck = await client.query(`
    SELECT EXISTS (
      SELECT FROM pg_views 
      WHERE viewname = 'llm_config_view'
    ) as view_exists;
  `);
  
  console.log('View check result:', viewCheck.rows[0]);
  
  if (!viewCheck.rows[0].view_exists) {
    // Check current schema for debugging
    const schemaCheck = await client.query('SELECT current_schema();');
    console.error('llm_config_view not found in schema:', {
      currentSchema: schemaCheck.rows[0].current_schema,
      viewExists: viewCheck.rows[0].view_exists
    });
    
    throw new Error('The llm_config_view does not exist in the current schema');
  }
  
  return true;
};

/**
 * Gets the preference type ID for LLM selection
 * @param {Object} client - Database client
 * @param {string} preferenceName - Name of the preference type to look up
 * @returns {Promise<number>} The preference type ID
 */
export const getLlmPreferenceTypeId = async (client, preferenceName = 'llm_selection') => {
  const prefTypeQuery = `
    SELECT id, name FROM preference_types WHERE name = $1;
  `;
  
  const prefTypeResult = await client.query(prefTypeQuery, [preferenceName]);
  console.log(`Preference type check for ${preferenceName}:`, prefTypeResult.rows);
  
  if (!prefTypeResult.rows || prefTypeResult.rows.length === 0) {
    throw new Error(`${preferenceName} type not found in preference_types table`);
  }
  
  return prefTypeResult.rows[0].id;
};
