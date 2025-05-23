/**
 * @file db/llm/getLlmConfigById.js
 * @description Gets LLM configuration by ID
 */

import { parseAdditionalConfig } from './utils/parsing.js';

/**
 * Gets LLM configuration by ID
 * @param {number} llmId - The LLM ID
 * @param {Object} pool - The database connection pool
 * @returns {Promise<Object>} The LLM configuration
 */
export async function getLlmConfigById(llmId, pool) {
  try {
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
      WHERE l.id = $1
      LIMIT 1;
    `;
    
    const { rows } = await pool.query(query, [llmId]);
    
    if (!rows || rows.length === 0) {
      console.error('No LLM configuration found for ID:', llmId);
      return null;
    }
    
    const config = { ...rows[0] };
    
    // Parse additional_config using our utility function
    config.additional_config = parseAdditionalConfig(config.additional_config);
    
    return config;
  } catch (error) {
    console.error('Error getting LLM config by ID:', error);
    throw error;
  }
}
