/**
 * @file src/services/llmService.js
 * @description Service for interacting with various LLM providers via their APIs
 */

import Anthropic from '@anthropic-ai/sdk';
import { pool } from '../db/connection.js';

// Initialize the LLM client
let llmClient = null;
let currentProvider = null;
let currentConfig = null;

/**
 * Get the LLM participant ID
 * 
 * @returns {Promise<number>} The ID of the LLM participant or default ID (817)
 */
export async function getLLMParticipantId() {
  try {
    const query = `
      SELECT id FROM public.participants
      WHERE name = 'llm'
    `;
    
    const { rows } = await pool.query(query);
    
    if (rows.length > 0) {
      return rows[0].id;
    }
    
    // If LLM participant not found, return the default ID
    console.warn('LLM participant not found in database, using default ID (817)');
    return 817; // Default ID for LLM participant
  } catch (error) {
    console.error('Error getting LLM participant ID:', error);
    console.warn('Using default ID (817) due to error');
    return 817; // Default ID in case of error
  }
}

/**
 * Get the LLM configuration for a specific LLM ID
 * 
 * @param {number} llmId - The LLM ID to get the configuration for
 * @returns {Promise<Object|null>} The LLM configuration or null if not found
 */
export async function getLLMConfig(llmId) {
  try {
    const query = `
      SELECT provider, model, api_key, temperature, max_tokens, additional_config
      FROM public.llms
      WHERE id = $1
    `;
    
    const { rows } = await pool.query(query, [llmId]);
    
    if (rows.length > 0) {
      const llm = rows[0];
      // Combine the structured fields with the additional_config JSON
      const config = {
        provider: llm.provider,
        model: llm.model,
        api_key: llm.api_key,
        temperature: llm.temperature,
        max_tokens: llm.max_tokens,
        ...llm.additional_config
      };
      return config;
    }
    
    // If no configuration found, return null
    console.warn(`No LLM configuration found for LLM ID ${llmId}`);
    return null;
  } catch (error) {
    console.error(`Error getting LLM configuration for LLM ID ${llmId}:`, error);
    return null;
  }
}

/**
 * Get the LLM configuration for a specific participant
 * 
 * @param {number} participantId - The participant ID to get the LLM configuration for
 * @returns {Promise<Object|null>} The LLM configuration or null if not found
 */
export async function getLLMConfigByParticipantId(participantId) {
  try {
    const query = `
      SELECT l.id, l.provider, l.model, l.api_key, l.temperature, l.max_tokens, l.additional_config
      FROM public.llms l
      JOIN public.participants p ON l.id = p.llm_id
      WHERE p.id = $1
    `;
    
    const { rows } = await pool.query(query, [participantId]);
    
    if (rows.length > 0) {
      const llm = rows[0];
      // Combine the structured fields with the additional_config JSON
      const config = {
        id: llm.id,
        provider: llm.provider,
        model: llm.model,
        api_key: llm.api_key,
        temperature: llm.temperature,
        max_tokens: llm.max_tokens,
        ...llm.additional_config
      };
      return config;
    }
    
    // If no configuration found, get the default LLM configuration
    console.warn(`No LLM configuration found for participant ID ${participantId}, using default LLM`);
    return await getDefaultLLMConfig();
  } catch (error) {
    console.error(`Error getting LLM configuration for participant ID ${participantId}:`, error);
    return await getDefaultLLMConfig();
  }
}

/**
 * Get the default LLM configuration
 * 
 * @returns {Promise<Object|null>} The default LLM configuration or null if not found
 */
export async function getDefaultLLMConfig() {
  try {
    // Get the default LLM (ID 1)
    return await getLLMConfig(1);
  } catch (error) {
    console.error('Error getting default LLM configuration:', error);
    
    // If all else fails, return a hardcoded default configuration
    console.warn('Using hardcoded default LLM configuration');
    return {
      provider: 'anthropic',
      model: 'claude-3-opus-20240229',
      api_key: process.env.LLM_API_KEY || '',
      temperature: 0.3,
      max_tokens: 1000,
      top_p: 0.7
    };
  }
}

/**
 * Get the LLM name
 * 
 * @param {number} [llmId=1] - The ID of the LLM to get the name for (defaults to 1)
 * @returns {Promise<string>} The name of the LLM or default name ('LLM')
 */
export async function getLLMName(llmId = 1) {
  try {
    const query = `
      SELECT name FROM public.llms
      WHERE id = $1
    `;
    
    const { rows } = await pool.query(query, [llmId]);
    
    if (rows.length > 0 && rows[0].name) {
      return rows[0].name;
    }
    
    // If LLM not found or name is empty, try to get from participants table as fallback
    try {
      const participantQuery = `
        SELECT name FROM public.participants
        WHERE name = 'llm'
      `;
      
      const participantResult = await pool.query(participantQuery);
      
      if (participantResult.rows.length > 0) {
        return participantResult.rows[0].name;
      }
    } catch (fallbackError) {
      console.error('Error getting LLM name from participants table:', fallbackError);
    }
    
    // If LLM not found in either table, return the default name
    console.warn(`LLM with ID ${llmId} not found in database, using default name ("LLM")`);
    return 'LLM'; // Default name with proper capitalization
  } catch (error) {
    console.error(`Error getting LLM name for ID ${llmId}:`, error);
    console.warn('Using default name ("LLM") due to error');
    return 'LLM'; // Default name in case of error with proper capitalization
  }
}

/**
 * Initialize the LLM service with the provided configuration, participant ID, or environment variable
 * 
 * @param {Object|number} configOrParticipantId - The LLM configuration or participant ID (optional)
 * @returns {Promise<boolean>} Whether the initialization was successful
 */
export async function initLLMService(configOrParticipantId = null) {
  let config = null;
  
  // If a number is provided, treat it as a participant ID
  if (typeof configOrParticipantId === 'number') {
    config = await getLLMConfigByParticipantId(configOrParticipantId);
  } 
  // If an object is provided, treat it as a configuration
  else if (configOrParticipantId && typeof configOrParticipantId === 'object') {
    config = configOrParticipantId;
  } 
  // Otherwise, get the default LLM configuration
  else {
    config = await getDefaultLLMConfig();
  }
  
  // If no configuration could be determined, return false
  if (!config) {
    console.error('Failed to determine LLM configuration');
    return false;
  }
  
  // Store the current configuration
  currentConfig = config;
  
  try {
    // Initialize the appropriate client based on the provider
    const provider = config.provider?.toLowerCase() || 'anthropic';
    currentProvider = provider;
    
    switch (provider) {
      case 'anthropic':
        llmClient = new Anthropic({
          apiKey: config.api_key,
        });
        console.log(`Initialized Anthropic client with model ${config.model || 'claude-3-opus-20240229'}`);
        break;
      
      // Add support for other providers here
      // case 'openai':
      //   llmClient = new OpenAI({
      //     apiKey: config.api_key,
      //   });
      //   console.log(`Initialized OpenAI client with model ${config.model || 'gpt-4'}`);
      //   break;
      
      default:
        console.error(`Unsupported LLM provider: ${provider}`);
        return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to initialize LLM service for provider ${config.provider}:`, error);
    return false;
  }
}

/**
 * Get a response from LLM for the given prompt
 * 
 * @param {string} prompt - The user's message
 * @param {Object} options - Optional parameters
 * @param {string} options.systemMessage - Custom system message (optional)
 * @param {Array<{role: string, content: string}>} options.messages - Array of message objects for conversation history (optional)
 * @param {number} options.temperature - Controls randomness (0.0-1.0, lower is more deterministic) (optional)
 * @param {number} options.topP - Controls diversity of responses (0.0-1.0) (optional)
 * @param {number} options.maxTokens - Maximum number of tokens in the response (optional)
 * @param {Object} options.config - LLM configuration to use for this request (optional)
 * @returns {Promise<string>} LLM's response
 */
export async function getLLMResponse(prompt, options = {}) {
  // If a configuration is provided, initialize the LLM service with it
  if (options.config && (!currentConfig || 
      options.config.provider !== currentProvider || 
      options.config.api_key !== currentConfig.api_key)) {
    const initialized = initLLMService(options.config);
    if (!initialized) {
      throw new Error(`Failed to initialize LLM service with provided configuration`);
    }
  }
  
  if (!llmClient) {
    throw new Error('LLM service not initialized');
  }
  
  // Default system message with enhanced instructions to prevent hallucinations
  let systemMessage = "You are a helpful AI assistant. Respond concisely and clearly. Only respond based on the information provided in the conversation. Do not make up or hallucinate information that isn't supported by the conversation context. If you don't know something or it wasn't mentioned in the conversation, acknowledge that rather than making up an answer.";
  
  // Override with custom system message if provided
  if (options.systemMessage) {
    systemMessage = options.systemMessage;
  }
  
  try {
    // Use provided messages array if available, otherwise create a simple one with just the prompt
    let messages = options.messages || [{ role: "user", content: prompt }];
    
    // If messages array doesn't include the current prompt, add it
    if (options.messages && !options.messages.some(m => m.role === 'user' && m.content === prompt)) {
      messages.push({ role: "user", content: prompt });
    }
    
    // Log the conversation being sent to LLM
    console.log(`Sending ${messages.length} messages to LLM (${currentProvider}) with system message: "${systemMessage.substring(0, 50)}..."`);
    
    // Handle different providers
    switch (currentProvider) {
      case 'anthropic': {
        // Set up request parameters with defaults that reduce hallucination risk
        const model = currentConfig.model || 'claude-3-opus-20240229';
        const requestParams = {
          model: model,
          max_tokens: options.maxTokens || 1000,
          messages: messages,
          system: systemMessage,
          temperature: options.temperature !== undefined ? options.temperature : 0.3, // Lower temperature (0.3) for more deterministic responses
          top_p: options.topP !== undefined ? options.topP : 0.7 // Lower top_p (0.7) to reduce unlikely token selections
        };
        
        const message = await llmClient.messages.create(requestParams);
        
        // Log the response for debugging
        console.log(`LLM (${currentProvider}) responded with ${message.content[0].text.length} characters`);
        
        return message.content[0].text;
      }
      
      // Add support for other providers here
      // case 'openai': {
      //   // Set up request parameters for OpenAI
      //   const model = currentConfig.model || 'gpt-4';
      //   const requestParams = {
      //     model: model,
      //     messages: [
      //       { role: 'system', content: systemMessage },
      //       ...messages
      //     ],
      //     max_tokens: options.maxTokens || 1000,
      //     temperature: options.temperature !== undefined ? options.temperature : 0.3,
      //     top_p: options.topP !== undefined ? options.topP : 0.7
      //   };
      //   
      //   const response = await llmClient.chat.completions.create(requestParams);
      //   
      //   // Log the response for debugging
      //   console.log(`LLM (${currentProvider}) responded with ${response.choices[0].message.content.length} characters`);
      //   
      //   return response.choices[0].message.content;
      // }
      
      default:
        throw new Error(`Unsupported LLM provider: ${currentProvider}`);
    }
  } catch (error) {
    console.error(`Error getting response from LLM (${currentProvider}):`, error);
    throw new Error(`Failed to get response from LLM: ${error.message}`);
  }
}