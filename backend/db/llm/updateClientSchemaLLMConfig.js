/**
 * @file db/llm/updateClientSchemaLLMConfig.js
 * @description Updates the LLM configuration for a client schema
 */

import { getClientLLMConfig } from './getClientSchemaLLMConfig.js';

/**
 * Updates the LLM configuration for a client schema
 * @param {number} clientSchemaId - The client schema ID
 * @param {number} llmId - The LLM ID to set
 * @param {Object} pool - The database connection pool
 * @returns {Promise<Object>} The updated LLM configuration
 */
export async function updateClientSchemaLLMConfig(clientSchemaId, llmId, pool) {
  try {
    if (!pool) {
      throw new Error('Database pool is required');
    }

    // First, get the preference type ID for LLM preferences
    const preferenceTypeQuery = `
      SELECT id FROM preference_types 
      WHERE name = 'llm_preference' 
      LIMIT 1;
    `;
    
    const preferenceTypeResult = await pool.query(preferenceTypeQuery);
    
    if (preferenceTypeResult.rows.length === 0) {
      throw new Error('LLM preference type not found');
    }
    
    const preferenceTypeId = preferenceTypeResult.rows[0].id;
    
    // Check if the LLM exists
    const llmCheckQuery = 'SELECT id FROM llms WHERE id = $1';
    const llmCheckResult = await pool.query(llmCheckQuery, [llmId]);
    
    if (llmCheckResult.rows.length === 0) {
      throw new Error(`LLM with ID ${llmId} not found`);
    }
    
    // Check if a preference already exists for this client schema
    const checkExistingQuery = `
      SELECT id FROM client_schema_preferences 
      WHERE client_schema_id = $1 AND preference_type_id = $2
    `;
    
    const existingPref = await pool.query(checkExistingQuery, [clientSchemaId, preferenceTypeId]);
    
    // Start a transaction
    await pool.query('BEGIN');
    
    try {
      let result;
      
      if (existingPref.rows.length > 0) {
        // Update existing preference
        const updateQuery = `
          UPDATE client_schema_preferences 
          SET preference_value = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING *;
        `;
        
        result = await pool.query(updateQuery, [
          JSON.stringify({ llmId }),
          existingPref.rows[0].id
        ]);
      } else {
        // Insert new preference
        const insertQuery = `
          INSERT INTO client_schema_preferences 
          (client_schema_id, preference_type_id, preference_value, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
          RETURNING *;
        `;
        
        result = await pool.query(insertQuery, [
          clientSchemaId,
          preferenceTypeId,
          JSON.stringify({ llmId })
        ]);
      }
      
      // Commit the transaction
      await pool.query('COMMIT');
      
      // Get the updated LLM config
      return await getClientSchemaLLMConfig(clientSchemaId, pool);
    } catch (error) {
      // Rollback the transaction on error
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error in updateClientSchemaLLMConfig:', error);
    throw error;
  }
}
