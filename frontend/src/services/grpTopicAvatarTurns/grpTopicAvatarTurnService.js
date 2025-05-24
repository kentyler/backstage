/**
 * @file src/services/grpTopicAvatarTurns/grpTopicAvatarTurnService.js
 * @description Service for managing grpTopicAvatarTurn-related operations
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Submits a prompt to create a new turn and optionally get an AI response
 * @param {string} prompt - The prompt to send
 * @param {Object} options - Additional options
 * @param {number} options.topicPathId - The ID of the topic path (required)
 * @param {number} options.avatarId - The ID of the user's avatar (required)
 * @param {number} options.participantId - The ID of the participant (optional)
 * @param {number} options.currentMessageId - The ID of the current message (optional)
 * @returns {Promise<Object>} The response with created turn
 */
async function submitPrompt(prompt, options = {}) {
  const { topicPathId, avatarId, currentMessageId, participantId } = options;
  
  console.log('=== submitPrompt called ===');
  console.log('Prompt:', prompt);
  console.log('Options:', options);
  
  if (!topicPathId) {
    throw new Error('topicPathId is required');
  }
  
  // Convert to string and trim any whitespace
  const cleanTopicPathId = String(topicPathId).trim();
  
  if (!avatarId) throw new Error('avatarId is required');
  if (isNaN(Number(avatarId))) throw new Error('avatarId must be a number');

  try {
    // Use the existing /api/llm/prompt endpoint as that's what's set up in the backend
    const response = await fetch(`${API_BASE_URL}/api/llm/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for sending cookies with the request
      body: JSON.stringify({
        prompt,
        topicPathId: cleanTopicPathId,
        avatarId: Number(avatarId),
        currentMessageId: currentMessageId || null,
        participantId: participantId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit prompt');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting prompt:', error);
    throw error;
  }
}

/**
 * Gets turns (messages) for a specific topic
 * @param {number} topicId - The ID of the topic
 * @returns {Promise<Array>} Array of turns/messages
 */
async function getTurnsByTopicId(topicId) {
  if (!topicId) {
    throw new Error('topicId is required');
  }

  console.log('DEBUG getTurnsByTopicId - Called with topicId:', topicId);

  try {
    const url = `${API_BASE_URL}/api/topics/id/${encodeURIComponent(topicId)}`;
    console.log('DEBUG getTurnsByTopicId - Fetching from URL:', url);
    
    const response = await fetch(url, {
      credentials: 'include' // Important for session cookies
    });
    
    console.log('DEBUG getTurnsByTopicId - Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('DEBUG getTurnsByTopicId - Error response:', error);
      throw new Error(error.error || 'Failed to fetch topic turns');
    }

    const data = await response.json();
    console.log(`DEBUG getTurnsByTopicId - Received ${data?.length || 0} messages from API`);
    
    // Log details of each message to debug turn_kind_id and filtering issues
    if (data && data.length > 0) {
      data.forEach((msg, idx) => {
        console.log(`DEBUG getTurnsByTopicId - Message ${idx}:`, {
          id: msg.id,
          content: msg.content?.substring(0, 30) + (msg.content?.length > 30 ? '...' : ''),
          isUser: msg.isUser,
          turn_kind_id: msg.turn_kind_id
        });
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching turns by topic ID:', error);
    throw error;
  }
}

/**
 * Helper function to process and transform related messages to the format expected by the UI
 * @param {Object|Array} result - The raw API response containing related messages
 * @returns {Array} Transformed array of related messages
 */
function processRelatedMessages(result) {
  // Log the structure of what we received
  console.log('Response structure:', {
    isArray: Array.isArray(result),
    length: Array.isArray(result) ? result.length : 'not an array',
    firstItem: Array.isArray(result) && result.length > 0 ? result[0] : 'no items'
  });
  
  // Handle different possible response formats
  let messagesToProcess = [];
  
  if (Array.isArray(result)) {
    // Direct array of messages
    messagesToProcess = result;
  } else if (result && result.relevantMessages && Array.isArray(result.relevantMessages)) {
    // Object with relevantMessages array property
    messagesToProcess = result.relevantMessages;
  } else if (result && result.messages && Array.isArray(result.messages)) {
    // Object with messages array property
    messagesToProcess = result.messages;
  }
  
  // Transform the result format to match what's expected by the RelatedMessages component
  const transformedMessages = messagesToProcess.map(msg => ({
    id: msg.id || `related-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content: msg.content || msg.snippet || msg.text || '', 
    score: msg.score || msg.similarity || 0,
    author: msg.author || (msg.isUser ? 'You' : 'AI'),
    isUser: !!msg.isUser,
    timestamp: msg.createdAt || msg.timestamp || new Date().toISOString(),
    messageType: msg.messageType || (msg.isUser ? 'user' : 'ai'),
    topicPath: msg.topicPath || 'Unknown topic',
    topicId: msg.topicId || 0
  }));
  
  console.log(`[DEBUG] Returning ${transformedMessages.length} transformed related messages`);
  return transformedMessages;
}

/**
 * Gets messages related to a specific message across all topics
 * @param {string} messageId - The ID of the message to find related messages for
 * @returns {Promise<Array>} Array of related messages with similarity scores
 */
async function getRelatedMessages(messageId) {
  if (!messageId) {
    throw new Error('messageId is required');
  }

  try {
    console.log(`Fetching related messages for message ID: ${messageId}`);
    
    // Use the dedicated endpoint for fetching related messages
    const url = `${API_BASE_URL}/api/messages/${messageId}/related`;
    console.log(`Making request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include' // Important for sending cookies with the request
    });

    if (!response.ok) {
      console.error(`Failed to get related messages: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to get related messages: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[DEBUG] Raw API response for related messages:`, result);
    return processRelatedMessages(result);
  } catch (error) {
    console.error('Error getting related messages:', error);
    return [];
  }
}

export default {
  submitPrompt,
  getTurnsByTopicId,
  getRelatedMessages
};
