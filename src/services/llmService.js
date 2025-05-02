/**
 * @file src/services/llmService.js
 * @description Service for interacting with various LLM providers via their APIs
 */

import Anthropic from '@anthropic-ai/sdk';
// Uncomment this line after installing the OpenAI SDK with: npm install openai
// import OpenAI from 'openai';
import { pool } from '../db/connection.js';
import { getPreferenceWithFallback } from '../db/preferences/getPreferenceWithFallback.js';
import { getParticipantById } from '../db/participants/getParticipantById.js';

// Initialize the LLM client
let llmClient = null;
let currentProvider = null;
let currentConfig = null;

/**
 * Get the LLM ID from preferences using the preference cascade
 * 
 * @param {number} [participantId=null] - The participant ID to get the LLM ID for (optional)
 * @param {number} [groupId=null] - The group ID to get the LLM ID for (optional)
 * @returns {Promise<number>} The ID of the preferred LLM
 * @throws {Error} If no LLM ID is found in the preference cascade
 */
export async function getLLMId(participantId = null, groupId = null) {
  try {
    // Use the preference cascade: participant > group > site
    const preference = await getPreferenceWithFallback('llm_selection', {
      participantId: participantId,
      groupId: groupId
    });
    
    // Get the LLM ID from the preference (assuming it's stored as a number)
    const llmId = preference?.value;
    
    if (!llmId) {
      // If no LLM ID is found in the preference cascade, use default LLM ID 1
      console.warn(`No LLM ID found in preferences for participant ${participantId}, group ${groupId}, or site. Using default LLM ID 1.`);
      return 1; // Default to LLM ID 1 (Claude)
    }
    
    console.log(`Using LLM ID ${llmId} from ${preference.source} preference.`);
    return llmId;
  } catch (error) {
    // If there's an error getting the preference, use default LLM ID 1
    console.warn(`Error getting LLM ID from preferences: ${error.message}. Using default LLM ID 1.`);
    return 1; // Default to LLM ID 1 (Claude)
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
 * Get the LLM configuration for a specific participant using the preference hierarchy
 * 
 * @param {number} participantId - The participant ID to get the LLM configuration for
 * @returns {Promise<Object|null>} The LLM configuration or null if not found
 */
export async function getLLMConfigByParticipantId(participantId) {
  try {
    // Get the LLM ID from preferences
    const llmId = await getLLMId(participantId);
    
    // Get the LLM configuration based on the LLM ID
    const llmConfig = await getLLMConfig(llmId);

    if (llmConfig) {
      console.log(`Using LLM configuration for LLM ID ${llmId} for participant ${participantId}`);
      return llmConfig;
    }
    
    // If no configuration found, get the default LLM configuration
    console.warn(`No LLM configuration found for LLM ID ${llmId}, using default LLM`);
    return await getDefaultLLMConfig();
  } catch (error) {
    console.error(`Error getting LLM configuration for participant ID ${participantId}:`, error);
    return await getDefaultLLMConfig();
  }
}

/**
 * Get the default LLM configuration from site preferences
 * 
 * @returns {Promise<Object>} The default LLM configuration
 * @throws {Error} If no default LLM configuration is found
 */
export async function getDefaultLLMConfig() {
  try {
    // Get the default LLM ID from site preferences
    const defaultLLMId = await getLLMId();
    
    // Get the LLM configuration for the default LLM ID
    const config = await getLLMConfig(defaultLLMId);
    
    if (!config) {
      throw new Error(`No configuration found for default LLM ID ${defaultLLMId}`);
    }
    
    return config;
  } catch (error) {
    console.error('Error getting default LLM configuration:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

/**
 * Get the LLM name based on the preference system
 * 
 * @param {number} [participantId=null] - The participant ID to get the LLM name for (optional)
 * @param {number} [groupId=null] - The group ID to get the LLM name for (optional)
 * @returns {Promise<string>} The name of the LLM or default name ('Anthropic Claude-3-Opus')
 */
export async function getLLMName(participantId = null, groupId = null) {
  try {
    // Get the LLM ID from the preference system
    const preference = await getPreferenceWithFallback('llm_selection', {
      participantId,
      groupId
    });
    
    // Get the LLM ID from the preference (assuming it's stored as a number)
    const llmId = preference?.value || 1;
    
    // Get the LLM name from the database
    const query = `
      SELECT name FROM public.llms
      WHERE id = $1
    `;
    
    const { rows } = await pool.query(query, [llmId]);
    
    if (rows.length > 0 && rows[0].name) {
      console.log(`Using LLM name from database: "${rows[0].name}" (ID: ${llmId}, source: ${preference?.source || 'default'})`);
      return rows[0].name;
    }
    
    // If LLM not found in the database, return the default name
    console.warn(`LLM with ID ${llmId} not found in database, using default name ("Anthropic Claude-3-Opus")`);
    return 'Anthropic Claude-3-Opus'; // Default name based on the database
  } catch (error) {
    console.error(`Error getting LLM name:`, error);
    console.warn('Using default name ("Anthropic Claude-3-Opus") due to error');
    return 'Anthropic Claude-3-Opus'; // Default name in case of error
  }
}

/**
 * Initialize the LLM service with the provided configuration, participant ID, group ID, or environment variable
 * 
 * @param {Object|number} configOrParticipantId - The LLM configuration or participant ID (optional)
 * @param {Object} [options={}] - Additional options
 * @param {number} [options.groupId] - The group ID to use for preference lookup (optional)
 * @returns {Promise<boolean>} Whether the initialization was successful
 */
export async function initLLMService(configOrParticipantId = null, options = {}) {
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
    // If a group ID is provided, try to get the group preference
    if (options.groupId) {
      try {
        const preference = await getPreferenceWithFallback('llm_selection', {
          groupId: options.groupId
        });
        
        if (preference && preference.value) {
          config = await getLLMConfig(preference.value);
          console.log(`Using LLM configuration from ${preference.source} preference for group ${options.groupId}`);
        }
      } catch (error) {
        console.error(`Error getting LLM preference for group ${options.groupId}:`, error);
      }
    }
    
    // If no config was found from group preference, use default
    if (!config) {
      config = await getDefaultLLMConfig();
    }
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
      case 'openai':
        // Uncomment this block after installing the OpenAI SDK
        // llmClient = new OpenAI({
        //   apiKey: config.api_key,
        //   organization: config.organization_id || config.additional_config?.organization_id
        // });
        // console.log(`Initialized OpenAI client with model ${config.model || 'gpt-4'}`);
        
        // Until OpenAI SDK is installed, throw an error
        throw new Error('OpenAI SDK not installed. Please run: npm install openai');
        break;
      
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
      case 'openai': {
        // Uncomment this block after installing the OpenAI SDK
        // // Set up request parameters for OpenAI
        // const model = currentConfig.model || 'gpt-4';
        // const requestParams = {
        //   model: model,
        //   messages: [
        //     { role: 'system', content: systemMessage },
        //     ...messages
        //   ],
        //   max_tokens: options.maxTokens || 1000,
        //   temperature: options.temperature !== undefined ? options.temperature : 0.3,
        //   top_p: options.topP !== undefined ? options.topP : 0.7
        // };
        // 
        // const response = await llmClient.chat.completions.create(requestParams);
        // 
        // // Log the response for debugging
        // console.log(`LLM (${currentProvider}) responded with ${response.choices[0].message.content.length} characters`);
        // 
        // return response.choices[0].message.content;
        
        // Until OpenAI SDK is installed, throw an error
        throw new Error('OpenAI SDK not installed. Please run: npm install openai');
      }
      
      default:
        throw new Error(`Unsupported LLM provider: ${currentProvider}`);
    }
  } catch (error) {
    console.error(`Error getting response from LLM (${currentProvider}):`, error);
    throw new Error(`Failed to get response from LLM: ${error.message}`);
  }
}