/**
 * @file src/services/llmService.js
 * @description Service for interacting with various LLM providers via their APIs
 */

import Anthropic from '@anthropic-ai/sdk';
// OpenAI SDK is already installed
import OpenAI from 'openai';
import { pool, createPool } from '../db/connection.js';
import { getPreferenceWithFallback } from '../db/preferences/getPreferenceWithFallback.js';
import { getParticipantById } from '../db/participants/getParticipantById.js';
import { getDefaultSchema } from '../config/schema.js';

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
export async function getLLMId(participantId = null, groupId = null, schema = null) {
  try {
    // Use the preference cascade: participant > group > site
    const preference = await getPreferenceWithFallback('llm_selection', {
      participantId: participantId,
      groupId: groupId,
      schema: schema || getDefaultSchema()
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
 * @param {string} [schema=null] - The schema to use for database operations (optional)
 * @returns {Promise<Object|null>} The LLM configuration or null if not found
 */
export async function getLLMConfig(llmId, schema = null) {
  try {
    const query = `
      SELECT l.*, t.name as type_name, t.api_handler
      FROM llms l
      JOIN llm_types t ON l.type_id = t.id
      WHERE l.id = $1
    `;
    
    // Use a schema-specific pool if a schema is provided
    const schemaPool = schema ? createPool(schema) : pool;
    const { rows } = await schemaPool.query(query, [llmId]);
    
    if (rows.length > 0) {
      const llm = rows[0];
      console.log(`Raw LLM config for ID ${llmId}:`, JSON.stringify(llm, null, 2));
      console.log(`additional_config type:`, typeof llm.additional_config);
      console.log(`additional_config value:`, llm.additional_config);
      
      // Process additional_config based on its type
      let parsedAdditionalConfig = {};
      if (llm.additional_config) {
        if (typeof llm.additional_config === 'string') {
          try {
            // Check if the string has extra quotes (like '{"key": "value"}')
            let jsonString = llm.additional_config;
            
            // Remove extra single quotes and newlines if present
            if (jsonString.startsWith("'") && jsonString.endsWith("'\n") || 
                jsonString.startsWith("'") && jsonString.endsWith("'")) {
              jsonString = jsonString.replace(/^'|'\n$|'$/g, '');
              console.log(`Cleaned additional_config string:`, jsonString);
            }
            
            parsedAdditionalConfig = JSON.parse(jsonString);
            console.log(`Parsed additional_config from string:`, parsedAdditionalConfig);
          } catch (e) {
            console.error(`Error parsing additional_config string:`, e);
            
            // Try a regex approach as fallback
            try {
              const assistantIdMatch = llm.additional_config.match(/"assistant_id"\s*:\s*"([^"]+)"/);
              if (assistantIdMatch && assistantIdMatch[1]) {
                parsedAdditionalConfig = { assistant_id: assistantIdMatch[1] };
                console.log(`Extracted assistant_id using regex:`, parsedAdditionalConfig);
              }
            } catch (regexError) {
              console.error(`Error extracting assistant_id with regex:`, regexError);
            }
          }
        } else if (typeof llm.additional_config === 'object') {
          // PostgreSQL JSONB fields are returned as objects by node-postgres
          parsedAdditionalConfig = llm.additional_config;
          console.log(`Using additional_config object directly:`, parsedAdditionalConfig);
        }
      }
      
      // Combine the structured fields with the additional_config JSON
      const config = {
        provider: llm.provider,
        model: llm.model,
        api_key: llm.api_key,
        temperature: llm.temperature,
        max_tokens: llm.max_tokens, // This field now serves dual purpose: response length limit and context window size
        type_name: llm.type_name,
        api_handler: llm.api_handler,
        // Add assistant_id directly if it's in the additional_config
        assistant_id: parsedAdditionalConfig.assistant_id,
        // Include the full additional_config
        additional_config: parsedAdditionalConfig
      };
      
      console.log(`Processed LLM config for ID ${llmId}:`, JSON.stringify({
        ...config,
        api_key: '***REDACTED***' // Don't log the API key
      }, null, 2));
      
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
 * @param {string} [schema=null] - The schema to use for database operations (optional)
 * @returns {Promise<Object|null>} The LLM configuration or null if not found
 */
export async function getLLMConfigByParticipantId(participantId, schema = null) {
  try {
    // Get the LLM ID from preferences
    const llmId = await getLLMId(participantId, null, schema);
    
    // Get the LLM configuration based on the LLM ID
    const llmConfig = await getLLMConfig(llmId);

    if (llmConfig) {
      console.log(`Using LLM configuration for LLM ID ${llmId} for participant ${participantId}`);
      return llmConfig;
    }
    
    // If no configuration found, get the default LLM configuration
    console.warn(`No LLM configuration found for LLM ID ${llmId}, using default LLM`);
    return await getDefaultLLMConfig(schema);
  } catch (error) {
    console.error(`Error getting LLM configuration for participant ID ${participantId}:`, error);
    return await getDefaultLLMConfig(schema);
  }
}

/**
 * Get the default LLM configuration from site preferences
 * 
 * @param {string} [schema=null] - The schema to use for database operations
 * @returns {Promise<Object>} The default LLM configuration
 * @throws {Error} If no default LLM configuration is found
 */
export async function getDefaultLLMConfig(schema = null) {
  try {
    // Get the default LLM ID from site preferences
    const defaultLLMId = await getLLMId(null, null, schema);
    
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
 * @param {string} [schema=null] - The schema to use for database operations (optional)
 * @returns {Promise<string>} The name of the LLM or default name ('Anthropic Claude-3-Opus')
 */
export async function getLLMName(participantId = null, groupId = null, schema = null) {
  try {
    // Get the LLM ID from the preference system
    const preference = await getPreferenceWithFallback('llm_selection', {
      participantId,
      groupId,
      schema: schema || getDefaultSchema()
    });
    
    // Get the LLM ID from the preference (assuming it's stored as a number)
    const llmId = preference?.value || 1;
    
    // Get the LLM name from the database
    const query = `
      SELECT name FROM llms
      WHERE id = $1
    `;
    
    // Use a schema-specific pool if a schema is provided
    const schemaPool = schema ? createPool(schema) : pool;
    const { rows } = await schemaPool.query(query, [llmId]);
    
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
 * @param {string} [options.schema=null] - The schema to use for database operations (optional)
 * @returns {Promise<boolean>} Whether the initialization was successful
 */
export async function initLLMService(configOrParticipantId = null, options = {}) {
  let config = null;
  const schema = options.schema || getDefaultSchema();
  
  // If a number is provided, treat it as a participant ID
  if (typeof configOrParticipantId === 'number') {
    config = await getLLMConfigByParticipantId(configOrParticipantId, schema);
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
          groupId: options.groupId,
          schema
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
      config = await getDefaultLLMConfig(schema);
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
    // Initialize the appropriate client based on the LLM type
    const typeName = config.type_name?.toLowerCase() || 'anthropic';
    currentProvider = typeName;
    
    switch (typeName) {
      case 'anthropic':
        llmClient = new Anthropic({
          apiKey: config.api_key,
        });
        console.log(`Initialized Anthropic client with model ${config.model || 'claude-3-opus-20240229'}`);
        break;
      
      // Both OpenAI Chat and OpenAI Assistant use the same client
      case 'openai':
      case 'openai_assistant':
        llmClient = new OpenAI({
          apiKey: config.api_key,
          organization: config.organization_id || config.additional_config?.organization_id
        });
        console.log(`Initialized OpenAI client with type ${typeName} and model ${config.model || 'gpt-4'}`);
        break;
      
      default:
        console.error(`Unsupported LLM type: ${typeName}`);
        return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to initialize LLM service for provider ${config.provider}:`, error);
    return false;
  }
}

/**
 * Handle a request to the Anthropic API
 * 
 * @param {string} prompt - The user's message
 * @param {Object} config - The LLM configuration
 * @param {Object} options - Additional options
 * @returns {Promise<string>} The LLM's response
 */
async function handleAnthropicRequest(prompt, config, options) {
  // Set up request parameters with defaults that reduce hallucination risk
  const model = config.model || 'claude-3-opus-20240229';
  const messages = options.messages || [{ role: "user", content: prompt }];
  const systemMessage = options.systemMessage || "You are a helpful AI assistant. Respond concisely and clearly. Only respond based on the information provided in the conversation. Do not make up or hallucinate information that isn't supported by the conversation context. If you don't know something or it wasn't mentioned in the conversation, acknowledge that rather than making up an answer.";
  
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
  console.log(`LLM (anthropic) responded with ${message.content[0].text.length} characters`);
  
  return message.content[0].text;
}

/**
 * Handle a request to the OpenAI Chat Completions API
 * 
 * @param {string} prompt - The user's message
 * @param {Object} config - The LLM configuration
 * @param {Object} options - Additional options
 * @returns {Promise<string>} The LLM's response
 */
async function handleOpenAIRequest(prompt, config, options) {
  // Set up request parameters for OpenAI
  const model = config.model || 'gpt-4';
  let messages = options.messages || [{ role: "user", content: prompt }];
  const systemMessage = options.systemMessage || "You are a helpful AI assistant. Respond concisely and clearly. Only respond based on the information provided in the conversation. Do not make up or hallucinate information that isn't supported by the conversation context. If you don't know something or it wasn't mentioned in the conversation, acknowledge that rather than making up an answer.";
  
  // Get the model's context window size from max_tokens, default to 8192 if not set
  const modelContextSize = config.max_tokens || 8192;
  
  // Set the threshold for truncation (80% of model context size)
  const truncationThreshold = Math.floor(modelContextSize * 0.8);
  
  // Ensure the current prompt is included in messages
  const currentPromptIncluded = messages.some(m => m.role === 'user' && m.content === prompt);
  if (!currentPromptIncluded) {
    messages.push({ role: "user", content: prompt });
  }
  
  // Estimate token count for input (rough estimate: 1 token ≈ 4 characters for English text)
  let estimatedInputTokens = 0;
  
  // Count system message tokens
  const systemTokens = Math.ceil(systemMessage.length / 4);
  estimatedInputTokens += systemTokens;
  
  // Create a map of messages with their estimated token counts
  const messageTokenCounts = messages.map(message => ({
    message,
    tokens: Math.ceil(message.content.length / 4)
  }));
  
  // Calculate total tokens from all messages
  const totalMessageTokens = messageTokenCounts.reduce((sum, item) => sum + item.tokens, 0);
  estimatedInputTokens += totalMessageTokens;
  
  console.log(`Estimated input tokens for OpenAI: ${estimatedInputTokens}`);
  
  // Implement conversation history truncation if needed
  if (estimatedInputTokens > truncationThreshold) {
    console.log(`Truncating conversation history (${estimatedInputTokens} tokens exceeds ${truncationThreshold} threshold)`);
    
    // Sort messages by importance: keep system message and most recent messages
    // First, find the current prompt message
    const currentPromptIndex = messages.findIndex(m => m.role === 'user' && m.content === prompt);
    
    // Create a new array with only the essential messages
    const essentialMessages = [];
    
    // Always include the current prompt
    if (currentPromptIndex !== -1) {
      essentialMessages.push(messages[currentPromptIndex]);
    }
    
    // If there's a response to the current prompt, include it too
    if (currentPromptIndex !== -1 && currentPromptIndex + 1 < messages.length && messages[currentPromptIndex + 1].role === 'assistant') {
      essentialMessages.push(messages[currentPromptIndex + 1]);
    }
    
    // Calculate tokens for essential messages
    let essentialTokens = essentialMessages.reduce((sum, message) => sum + Math.ceil(message.content.length / 4), 0);
    
    // Add system message tokens
    essentialTokens += systemTokens;
    
    // Calculate how many more tokens we can include
    const remainingTokens = truncationThreshold - essentialTokens;
    
    // Add as many previous messages as possible, starting from the most recent
    // (excluding the ones we've already added)
    const previousMessages = messages
      .filter(m => !essentialMessages.includes(m))
      .reverse(); // Start with the most recent
    
    const additionalMessages = [];
    let additionalTokens = 0;
    
    for (const message of previousMessages) {
      const messageTokens = Math.ceil(message.content.length / 4);
      if (additionalTokens + messageTokens <= remainingTokens) {
        additionalMessages.push(message);
        additionalTokens += messageTokens;
      } else {
        break;
      }
    }
    
    // Combine all messages and sort them back into chronological order
    messages = [...additionalMessages.reverse(), ...essentialMessages]
      .sort((a, b) => {
        // Keep original order if possible
        const aIndex = messages.indexOf(a);
        const bIndex = messages.indexOf(b);
        return aIndex - bIndex;
      });
    
    // Recalculate estimated tokens
    estimatedInputTokens = systemTokens + messages.reduce((sum, message) => sum + Math.ceil(message.content.length / 4), 0);
    console.log(`After truncation: ${estimatedInputTokens} tokens (${messages.length} messages)`);
  }
  
  // Calculate safe max_tokens with a 10% safety margin
  const safetyMargin = Math.floor(modelContextSize * 0.1);
  const availableTokens = modelContextSize - estimatedInputTokens - safetyMargin;
  const safeMaxTokens = Math.max(100, Math.min(availableTokens, options.maxTokens || 1000));
  
  console.log(`Using max_tokens=${safeMaxTokens} for OpenAI (model context size: ${modelContextSize}, estimated input: ${estimatedInputTokens})`);
  
  const requestParams = {
    model: model,
    messages: [
      { role: 'system', content: systemMessage },
      ...messages
    ],
    max_tokens: safeMaxTokens,
    temperature: options.temperature !== undefined ? options.temperature : 0.3,
    top_p: options.topP !== undefined ? options.topP : 0.7
  };
  
  const response = await llmClient.chat.completions.create(requestParams);
  
  // Log the response for debugging
  console.log(`LLM (openai) responded with ${response.choices[0].message.content.length} characters`);
  
  return response.choices[0].message.content;
}

/**
 * Handle a request to the OpenAI Assistants API (Custom GPTs)
 * 
 * @param {string} prompt - The user's message
 * @param {Object} config - The LLM configuration
 * @param {Object} options - Additional options
 * @returns {Promise<string>} The LLM's response
 */
async function handleOpenAIAssistantRequest(prompt, config, options) {
  // Extract the assistant_id from config or additional_config
  let assistantId = config.assistant_id;
  
  // If not found directly, check if it's in additional_config
  if (!assistantId && config.additional_config && typeof config.additional_config === 'object') {
    assistantId = config.additional_config.assistant_id;
  }
  
  // If still not found, try parsing additional_config if it's a string
  if (!assistantId && config.additional_config && typeof config.additional_config === 'string') {
    try {
      const parsedConfig = JSON.parse(config.additional_config);
      assistantId = parsedConfig.assistant_id;
    } catch (e) {
      console.error('Error parsing additional_config:', e);
    }
  }
  
  console.log('OpenAI Assistant config:', JSON.stringify(config, null, 2));
  
  if (!assistantId) {
    throw new Error('No assistant_id found in configuration for OpenAI Assistant');
  }
  
  // Create a thread
  const thread = await llmClient.beta.threads.create();
  
  // Add the user's message to the thread
  await llmClient.beta.threads.messages.create(thread.id, {
    role: "user",
    content: prompt
  });
  
  // Run the assistant on the thread
  const run = await llmClient.beta.threads.runs.create(thread.id, {
    assistant_id: assistantId
  });
  
  // Poll for completion
  let runStatus = await llmClient.beta.threads.runs.retrieve(thread.id, run.id);
  
  while (runStatus.status !== 'completed' && runStatus.status !== 'failed') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    runStatus = await llmClient.beta.threads.runs.retrieve(thread.id, run.id);
  }
  
  if (runStatus.status === 'failed') {
    throw new Error(`Assistant run failed: ${runStatus.last_error?.message || 'Unknown error'}`);
  }
  
  // Get the assistant's response
  const messages = await llmClient.beta.threads.messages.list(thread.id);
  
  // Find the most recent assistant message
  const assistantMessages = messages.data.filter(m => m.role === 'assistant');
  
  if (assistantMessages.length === 0) {
    throw new Error('No assistant response found');
  }
  
  // Return the content of the most recent assistant message
  console.log(`LLM (openai_assistant) responded with ${assistantMessages[0].content[0].text.value.length} characters`);
  
  return assistantMessages[0].content[0].text.value;
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
 * @param {string} options.schema - The schema to use for database operations (optional)
 * @returns {Promise<string>} LLM's response
 */
export async function getLLMResponse(prompt, options = {}) {
  // If a configuration is provided, initialize the LLM service with it
  if (options.config && (!currentConfig || 
      options.config.provider !== currentProvider || 
      options.config.api_key !== currentConfig.api_key)) {
    const initialized = initLLMService(options.config, { schema: options.schema });
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
    
    // Set up options for the handler
    const handlerOptions = {
      ...options,
      systemMessage,
      messages
    };
    
    // Use the api_handler field to determine which handler function to call
    switch (currentConfig.api_handler) {
      case 'handleAnthropicRequest':
        return await handleAnthropicRequest(prompt, currentConfig, handlerOptions);
      
      case 'handleOpenAIRequest':
        return await handleOpenAIRequest(prompt, currentConfig, handlerOptions);
      
      case 'handleOpenAIAssistantRequest':
        return await handleOpenAIAssistantRequest(prompt, currentConfig, handlerOptions);
      
      default:
        throw new Error(`Unsupported API handler: ${currentConfig.api_handler}`);
    }
  } catch (error) {
    console.error(`Error getting response from LLM (${currentProvider}):`, error);
    throw new Error(`Failed to get response from LLM: ${error.message}`);
  }
}