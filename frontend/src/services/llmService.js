/**
 * @file src/services/llmService.js
 * @description Service for managing LLM configurations with client schema preferences
 */

// Cache for LLM configuration
let llmConfigCache = {
  lastUpdated: null,
  currentConfig: null,
  clientSchemaId: null,
  participantId: null
};

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// LLM preference type ID (should match the name in the preference_types table)
const LLM_PREFERENCE_TYPE = 'llm_selection';

/**
 * Fetches the LLM configuration for a client schema
 * @param {number} clientSchemaId - The client schema ID
 * @returns {Promise<Object>} The LLM configuration
 */
const fetchLLMConfigForClientSchema = async (clientSchemaId) => {
  try {
    const response = await fetch(`/api/client-schemas/${clientSchemaId}/llm-config`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch LLM config: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching LLM config:', error);
    throw error;
  }
};

/**
 * Updates the LLM configuration for a client schema
 * @param {number} clientSchemaId - The client schema ID
 * @param {string} llmId - The ID of the LLM to set
 * @returns {Promise<Object>} The updated LLM configuration
 */
const updateLLMConfigForClientSchema = async (clientSchemaId, llmId) => {
  try {
    const response = await fetch(`/api/client-schemas/${clientSchemaId}/llm-config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ llmId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update LLM config: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating LLM config:', error);
    throw error;
  }
};

/**
 * Initializes the LLM service with the current participant and client schema
 * @param {number} participantId - The current participant ID
 * @param {number} clientSchemaId - The client schema ID
 * @returns {Promise<Object>} The current LLM configuration
 */
export const initializeLLMService = async (participantId, clientSchemaId) => {
  try {
    const now = Date.now();
    
    // Check if we have a valid cache
    const cacheIsValid = llmConfigCache.lastUpdated && 
                        (now - llmConfigCache.lastUpdated < CACHE_TTL) &&
                        llmConfigCache.participantId === participantId &&
                        llmConfigCache.clientSchemaId === clientSchemaId;
                        
    console.log('LLM Config Cache Check:', {
      hasCache: !!llmConfigCache.lastUpdated,
      isFresh: llmConfigCache.lastUpdated ? (now - llmConfigCache.lastUpdated < CACHE_TTL) : false,
      sameParticipant: llmConfigCache.participantId === participantId,
      sameClientSchema: llmConfigCache.clientSchemaId === clientSchemaId,
      cacheIsValid
    });

    if (!cacheIsValid) {
      // Fetch the LLM config for this client schema
      const llmConfig = await fetchLLMConfigForClientSchema(clientSchemaId);
      
      // Update cache
      llmConfigCache = {
        lastUpdated: now,
        currentConfig: llmConfig,
        clientSchemaId,
        participantId
      };

      console.log('Fetched and cached new LLM configuration:', {
        config: llmConfig,
        cachedAt: new Date(now).toISOString(),
        clientSchemaId,
        participantId
      });

      return llmConfigCache.currentConfig;
    } else {
      console.log('Using cached LLM configuration:', {
        config: llmConfigCache.currentConfig,
        lastUpdated: new Date(llmConfigCache.lastUpdated).toISOString(),
        age: Math.round((now - llmConfigCache.lastUpdated) / 1000) + 's old'
      });
      return llmConfigCache.currentConfig;
    }
  } catch (error) {
    console.error('Error initializing LLM service:', error);
    // Return the cached config if available, even if stale
    if (llmConfigCache.currentConfig) {
      return llmConfigCache.currentConfig;
    }
    throw error;
  }
};

/**
 * Gets the current LLM configuration
 * @returns {Object} The current LLM configuration or null if not initialized
 */
export const getCurrentLLMConfig = () => {
  return llmConfigCache.currentConfig || null;
};

/**
 * Updates the current LLM configuration
 * @param {string} llmId - The ID of the LLM to set as current
 * @returns {Promise<Object>} The updated LLM configuration
 */
export const setCurrentLLMConfig = async (llmId) => {
  try {
    if (!llmConfigCache.clientSchemaId) {
      throw new Error('LLM service not initialized with client schema');
    }

    // Update the configuration on the server
    const updatedConfig = await updateLLMConfigForClientSchema(
      llmConfigCache.clientSchemaId,
      llmId
    );

    // Update the cache
    llmConfigCache.currentConfig = updatedConfig;
    llmConfigCache.lastUpdated = Date.now();

    return updatedConfig;
  } catch (error) {
    console.error('Error updating LLM configuration:', error);
    throw error;
  }
};

/**
 * Refreshes the LLM configuration cache
 * @returns {Promise<Object>} The updated LLM configuration
 */
export const refreshLLMConfig = async () => {
  if (!llmConfigCache.participantId || !llmConfigCache.clientSchemaId) {
    throw new Error('LLM service not initialized with participant and client schema');
  }
  
  return initializeLLMService(
    llmConfigCache.participantId,
    llmConfigCache.clientSchemaId
  );
};

/**
 * Submits a prompt to the LLM and gets a response
 * @param {string} prompt - The prompt to send
 * @param {Object} options - Additional options
 * @param {number} options.topicPathId - The ID of the topic path (required)
 * @param {number} options.avatarId - The ID of the user's avatar (required)
 * @param {number} options.currentMessageId - The ID of the current message (optional)
 * @returns {Promise<Object>} The LLM response
 * @throws {Error} If required parameters are missing or invalid
 */
const submitPrompt = async (prompt, options = {}) => {
  const { topicPathId, avatarId, currentMessageId } = options;
  
  console.log('=== submitPrompt called ===');
  console.log('Prompt:', prompt);
  console.log('Options:', options);
  console.log('topicPathId:', topicPathId, 'Type:', typeof topicPathId);
  console.log('avatarId:', avatarId, 'Type:', typeof avatarId);
  console.log('currentMessageId:', currentMessageId, 'Type:', typeof currentMessageId);
  
  if (!topicPathId) {
    console.error('topicPathId is missing or empty');
    throw new Error('topicPathId is required');
  }
  
  // Convert to string and trim any whitespace
  const cleanTopicPathId = String(topicPathId).trim();
  console.log('Using topicPathId:', cleanTopicPathId);
  
  if (!avatarId) throw new Error('avatarId is required');
  if (isNaN(Number(avatarId))) throw new Error('avatarId must be a number');

  try {
    console.log('Sending request to /api/llm/prompt with:', {
      prompt,
      topicPathId: cleanTopicPathId,
      avatarId: Number(avatarId)
    });
    
    const response = await fetch('/api/llm/prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for sending cookies with the request
      body: JSON.stringify({
        prompt,
        topicPathId: cleanTopicPathId,
        avatarId: Number(avatarId),
        currentMessageId: currentMessageId || null
      })
    });

    const responseData = await response.json().catch(error => {
      console.error('Error parsing JSON response:', error);
      throw new Error('Invalid response from server');
    });

    if (!response.ok) {
      console.error('Error response from server:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
      
      const errorMessage = responseData.error || 
                         responseData.message || 
                         `Server responded with status ${response.status}`;
      
      throw new Error(errorMessage);
    }

    // Log detailed response information
    console.log('=== LLM Response Received ===');
    console.log('Status:', response.status);
    console.log('Response Data:', {
      text: responseData.text ? `[${responseData.text.length} chars]` : 'No text',
      relevantMessages: responseData.relevantMessages ? responseData.relevantMessages.length : 0,
      ...(responseData.text ? { preview: responseData.text.substring(0, 100) + (responseData.text.length > 100 ? '...' : '') } : {})
    });
    
    // Log information about relevant messages if they exist
    if (responseData.relevantMessages && responseData.relevantMessages.length > 0) {
      console.log(`Found ${responseData.relevantMessages.length} relevant messages:`);
      responseData.relevantMessages.forEach((msg, index) => {
        console.log(`Message ${index + 1}:`, {
          topicId: msg.topicId,
          topicPath: msg.topicPath,
          score: msg.score ? `${Math.round(msg.score * 100)}%` : 'N/A',
          contentPreview: msg.content ? msg.content.substring(0, 50) + '...' : 'No content'
        });
      });
    }
    
    return responseData;
  } catch (error) {
    console.error('Error submitting prompt:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};



export default {
  initializeLLMService,
  getCurrentLLMConfig,
  setCurrentLLMConfig,
  refreshLLMConfig,
  submitPrompt
};
