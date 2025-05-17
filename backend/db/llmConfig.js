/**
 * @file db/llmConfig.js
 * @description Database operations for LLM configurations
 */

import { Pool } from 'pg';

/**
 * Gets the LLM configuration for a client schema using the llm_config_view
 * @param {number} clientSchemaId - The client schema ID
 * @param {Object} pool - The database connection pool
 * @returns {Promise<Object>} The LLM configuration
 */
export const getClientSchemaLLMConfig = async (clientSchemaId, pool) => {
  console.log('getClientSchemaLLMConfig called with clientSchemaId:', clientSchemaId);
  let client;
  try {
    if (!pool) {
      throw new Error('Database pool is required');
    }

    // Get a client from the pool
    client = await pool.connect();
    console.log('Successfully connected to database pool');

    // First, check if the view exists
    console.log('Checking if llm_config_view exists in current schema...');
    const viewCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_views 
        WHERE viewname = 'llm_config_view'
      ) as view_exists;
    `);
    console.log('View check result:', viewCheck.rows[0]);
    
    if (!viewCheck.rows[0].view_exists) {
      // Check current schema
      const schemaCheck = await client.query('SELECT current_schema();');
      console.error('llm_config_view not found in schema:', {
        currentSchema: schemaCheck.rows[0].current_schema,
        viewExists: viewCheck.rows[0].view_exists
      });
      throw new Error('The llm_config_view does not exist in the current schema');
    }

    // First check if we have the llm_selection type
    const prefTypeQuery = `
      SELECT id, name FROM preference_types WHERE name = 'llm_selection';
    `;
    const prefTypeResult = await client.query(prefTypeQuery);
    console.log('Preference type check:', prefTypeResult.rows);

    if (!prefTypeResult.rows || prefTypeResult.rows.length === 0) {
      throw new Error('llm_selection type not found in preference_types table');
    }

    // Then check if we have any preferences for this client schema
    const prefQuery = `
      SELECT preference_value, preference_type_id, 
             pg_typeof(preference_value) as value_type
      FROM client_schema_preferences 
      WHERE client_schema_id = $1 AND preference_type_id = $2;
    `;
    const prefResult = await client.query(prefQuery, [clientSchemaId, prefTypeResult.rows[0].id]);
    console.log('Client schema preference details:', {
      preferences: prefResult.rows,
      valueType: prefResult.rows[0]?.value_type,
      rawValue: prefResult.rows[0]?.preference_value
    });

    const query = `
      SELECT 
        l.id AS id,
        l.name AS name,
        l.provider,
        l.model,
        l.temperature,
        l.max_tokens,
        l.additional_config,
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

    console.log('Executing LLM config query');
    console.log('Executing query for client schema ID:', clientSchemaId, 'and preference type ID:', prefTypeResult.rows[0].id);
    const result = await client.query(query, [clientSchemaId, prefTypeResult.rows[0].id]);
    console.log('LLM query details:', {
      sql: query,
      params: [clientSchemaId, prefTypeResult.rows[0].id],
      rowCount: result.rowCount,
      rows: result.rows
    });
    
    if (!result.rows || result.rows.length === 0) {
      throw new Error('No preferred LLM configuration found for client schema ' + clientSchemaId);
    }
    
    const config = { ...result.rows[0] };
    
    // Parse additional_config if it's a string
    if (config.additional_config && typeof config.additional_config === 'string') {
      try {
        config.additional_config = JSON.parse(config.additional_config);
      } catch (e) {
        console.error('Error parsing additional_config:', e);
        config.additional_config = {};
      }
    }
    
    return config;
  } catch (error) {
    console.error('Error in getClientSchemaLLMConfig:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    if (client) {
      await client.release();
    }
  }
};

/**
 * Updates the LLM configuration for a client schema
 * @param {number} clientSchemaId - The client schema ID
 * @param {number} llmId - The LLM ID to set
 * @param {Object} pool - The database connection pool
 * @returns {Promise<Object>} The updated LLM configuration
 */
export const updateClientSchemaLLMConfig = async (clientSchemaId, llmId, pool) => {
  let client;
  
  if (!pool) {
    throw new Error('Database pool is required');
  }

  client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // First, get the preference type ID for LLM preferences
    const preferenceTypeQuery = `
      SELECT id FROM preference_types 
      WHERE name = 'llm_preference' 
      LIMIT 1;
    `;
    
    const preferenceTypeResult = await client.query(preferenceTypeQuery);
    
    if (preferenceTypeResult.rows.length === 0) {
      throw new Error('LLM preference type not found');
    }
    
    const preferenceTypeId = preferenceTypeResult.rows[0].id;
    
    // Check if the LLM exists
    const llmCheckQuery = 'SELECT id FROM llms WHERE id = $1';
    const llmCheckResult = await client.query(llmCheckQuery, [llmId]);
    
    if (llmCheckResult.rows.length === 0) {
      throw new Error(`LLM with ID ${llmId} not found`);
    }
    
    // Check if a preference already exists for this client schema
    const checkExistingQuery = `
      SELECT id FROM client_schema_preferences 
      WHERE client_schema_id = $1 AND preference_type_id = $2
    `;
    
    const existingPref = await client.query(checkExistingQuery, [clientSchemaId, preferenceTypeId]);
    
    let result;
    
    if (existingPref.rows.length > 0) {
      // Update existing preference
      const updateQuery = `
        UPDATE client_schema_preferences 
        SET preference_value = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *;
      `;
      
      result = await client.query(updateQuery, [
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
      
      result = await client.query(insertQuery, [
        clientSchemaId,
        preferenceTypeId,
        JSON.stringify({ llmId })
      ]);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Get the updated LLM config
    const updatedConfig = await getClientSchemaLLMConfig(clientSchemaId, pool);
    
    // Parse additional_config if it's a string
    if (updatedConfig.additional_config && typeof updatedConfig.additional_config === 'string') {
      try {
        updatedConfig.additional_config = JSON.parse(updatedConfig.additional_config);
      } catch (e) {
        console.error('Error parsing additional_config:', e);
        updatedConfig.additional_config = {};
      }
    }
    
    return updatedConfig;
  } catch (error) {
    console.error('Error in updateClientSchemaLLMConfig:', error);
    throw error;
  } finally {
    if (client) {
      await client.release();
    }
  }
};
