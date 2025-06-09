import { storeMessage } from './common/storeMessage.js';
import { generateEmbedding } from './embeddings.js';
import { updateTurnVector } from '../db/participantTopicTurns/index.js';
import { findSimilarMessages } from '../db/messageSearch.js';

/**
 * Processes and stores a user message
 * @param {string} topicPathId - The topic path ID
 * @param {number} participantId - The participant ID
 * @param {string} content - The message content
 * @param {number|null} participantIdForMessage - The participant ID for the message (optional)
 * @param {object} pool - The database connection pool
 * @returns {Promise<number>} - The ID of the stored message
 */
export async function processUserMessage(topicPathId, participantId, content, participantIdForMessage, pool) {
  console.log('Storing user message...');
  const userMessageId = await storeMessage(topicPathId, participantId, content, true, null, participantIdForMessage, pool);
  console.log('User message stored with ID:', userMessageId);
  return userMessageId;
}

/**
 * Processes and stores an assistant message with embeddings
 * @param {string} topicPathId - The topic path ID
 * @param {number} participantId - The participant ID
 * @param {string} content - The message content
 * @param {number|null} llmId - The LLM ID (optional)
 * @param {object} pool - The database connection pool
 * @param {object} client - The database client
 * @returns {Promise<object>} - The message ID and relevant messages
 */
export async function processAssistantMessage(topicPathId, participantId, content, llmId, pool, client) {
  console.log('Storing assistant response...');
  console.log('Using LLM ID:', llmId);
  
  const assistantMessageId = await storeMessage(topicPathId, participantId, content, false, llmId, participantId, pool);
  console.log('Assistant response stored with ID:', assistantMessageId);
  
  // Generate and store embedding for the assistant's response
  // Also search for relevant messages using the same embedding
  let relevantMessages = [];
  try {
    // Generate embedding for the assistant response
    const embedding = await generateEmbedding(content);
    console.log('Generated embedding for assistant response');
    
    // Update the message with the embedding
    await updateTurnVector(assistantMessageId, embedding, pool, client);
    console.log('Updated assistant response with embedding');
    
    // Find relevant messages using the embedding
    console.log('Finding relevant messages for the response...');
    relevantMessages = await findSimilarMessages(embedding, topicPathId, 5, assistantMessageId);
    console.log(`Found ${relevantMessages.length} relevant messages`);
  } catch (error) {
    console.error('Error in embedding generation or finding relevant messages:', error);
    // Continue without failing the request
  }
  
  // Log the response before sending it back
  console.log('Sending response to client:', {
    responseLength: content?.length || 0,
    relevantMessagesCount: relevantMessages.length,
    preview: content?.substring(0, 100) + (content?.length > 100 ? '...' : '')
  });
  
  return {
    id: assistantMessageId,
    relevantMessages
  };
}
