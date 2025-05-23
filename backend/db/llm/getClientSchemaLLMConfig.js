/**
 * @file db/llm/getClientSchemaLLMConfig.js
 * @description Gets the LLM configuration for a client schema
 */

import { getLlmPreferenceTypeId } from './preferences/getLlmPreferenceTypeId.js';
import { parseAdditionalConfig } from './utils/parsing.js';

/**
 * Gets the LLM configuration for a client schema
 * @param {number} clientSchemaId - The client schema ID
 * @param {Object} pool - The database connection pool
 * @returns {Promise<Object>} The LLM configuration
 */
export async function getClientSchemaLLMConfig(clientSchemaId, pool) {
  console.log('getClientSchemaLLMConfig called with clientSchemaId:', clientSchemaId);
  
  try {
    if (!pool) {
      throw new Error('Database pool is required');
    }

    // First check if the view exists
    console.log('Checking if llm_config_view exists in current schema...');
    const viewCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_views 
        WHERE viewname = 'llm_config_view'
      ) as view_exists;
    `);
    
    console.log('View check result:', viewCheck.rows[0]);
    
    if (!viewCheck.rows[0].view_exists) {
      // Check current schema for debugging
      const schemaCheck = await pool.query('SELECT current_schema();');
      console.error('llm_config_view not found in schema:', {
        currentSchema: schemaCheck.rows[0].current_schema,
        viewExists: viewCheck.rows[0].view_exists
      });
      throw new Error('The llm_config_view does not exist in the current schema');
    }

    // Get the preference type ID for LLM selection
    const preferenceTypeId = await getLlmPreferenceTypeId(pool);

    // Get the LLM configuration using the view
    const query = `
      SELECT 
        l.id AS id,
        l.name AS name,
        l.provider,
        l.model,
        l.temperature,
        l.max_tokens,
        l.additional_config,
        l.api_key,
        lt.name AS type_name,
        lt.api_handler
      FROM llms l
      JOIN llm_types lt ON l.type_id = lt.id
      JOIN client_schema_preferences csp ON 
        l.id = csp.preference_value::integer
        AND csp.client_schema_id = $1
        AND csp.preference_type_id = $2
      LIMIT 1;
    `;

    console.log('Executing query for client schema ID:', clientSchemaId, 'and preference type ID:', preferenceTypeId);
    
    const { rows } = await pool.query(query, [clientSchemaId, preferenceTypeId]);
    
    console.log('LLM query details:', {
      rowCount: rows.length,
      rows: rows ? rows.map(r => ({
        id: r.id,
        name: r.name,
        provider: r.provider,
        model: r.model,
        hasApiKey: !!r.api_key,
        type_name: r.type_name
      })) : 'No rows returned'
    });
    
    if (rows.length === 0) {
      console.error('No LLM configuration found for client schema:', clientSchemaId);
      return null;
    }
    
    const config = { ...rows[0] };
    
    // Parse additional_config using our utility function
    config.additional_config = parseAdditionalConfig(config.additional_config);
    
    return config;
  } catch (error) {
    console.error('Error in getClientSchemaLLMConfig:', error);
    throw error;
  }
}
