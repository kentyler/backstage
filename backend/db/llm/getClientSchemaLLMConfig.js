/**
 * @file db/llm/getClientSchemaLLMConfig.js
 * @description Gets the LLM configuration for a client schema
 */

import { getLlmPreferenceTypeId } from './preferences/getLlmPreferenceTypeId.js';
import { parseAdditionalConfig } from './utils/parsing.js';

/**
 * Gets the LLM configuration for a client
 * @param {number} clientId - The client ID
 * @param {Object} pool - The database connection pool
 * @returns {Promise<Object>} The LLM configuration
 */
export async function getClientLLMConfig(clientId, pool) {
  console.log('getClientLLMConfig called with clientId:', clientId);
  
  try {
    if (!pool) {
      throw new Error('Database pool is required');
    }

    // Note: The llm_config_view was removed - using direct table joins instead

    // Get the LLM configuration from client's current_llm_id
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
      FROM clients c
      JOIN llms l ON l.id = c.current_llm_id
      JOIN llm_types lt ON l.type_id = lt.id
      WHERE c.id = $1;
    `;

    console.log('Executing query for client ID:', clientId);
    
    const { rows } = await pool.query(query, [clientId]);
    
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
      console.error('No LLM configuration found for client:', clientId);
      return null;
    }
    
    const config = { ...rows[0] };
    
    // Parse additional_config using our utility function
    config.additional_config = parseAdditionalConfig(config.additional_config);
    
    return config;
  } catch (error) {
    console.error('Error in getClientLLMConfig:', error);
    throw error;
  }
}
