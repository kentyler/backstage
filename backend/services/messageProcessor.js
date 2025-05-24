import { storeMessage } from './common/storeMessage.js';
import { generateEmbedding } from './embeddings.js';
import { updateTurnVector } from '../db/grpTopicAvatarTurns/index.js';
import { findSimilarMessages } from '../db/messageSearch.js';

/**
 * Processes and stores a user message
 * @param {string} topicPathId - The topic path ID
 * @param {number} avatarId - The avatar ID
 * @param {string} content - The message content
 * @param {number|null} participantId - The participant ID (optional)
 * @param {object} pool - The database connection pool
 * @returns {Promise<number>} - The ID of the stored message
 */
export async function processUserMessage(topicPathId, avatarId, content, participantId, pool) {
  console.log('Storing user message...');
  const userMessageId = await storeMessage(topicPathId, avatarId, content, true, null, participantId, pool);
  console.log('User message stored with ID:', userMessageId);
  return userMessageId;
}

/**
 * Processes and stores an assistant message with embeddings
 * @param {string} topicPathId - The topic path ID
 * @param {number} avatarId - The avatar ID
 * @param {string} content - The message content
 * @param {number|null} llmId - The LLM ID (optional)
 * @param {object} pool - The database connection pool
 * @param {object} client - The database client
 * @returns {Promise<object>} - The message ID and relevant messages
 */
export async function processAssistantMessage(topicPathId, avatarId, content, llmId, pool, client) {
  console.log('Storing assistant response...');
  console.log('Using LLM ID:', llmId);
  
  const assistantMessageId = await storeMessage(topicPathId, avatarId, content, false, llmId, null, pool);
  console.log('Assistant response stored with ID:', assistantMessageId);
  
  // Generate and store embedding for the assistant's response
  // Also search for relevant messages using the same embedding
  let relevantMessages = [];
  try {
    // Generate embedding for the assistant response
    const embedding = await generateEmbedding(content);
    console.log('Generated embedding for assistant response');
    
    // Update the message with the embedding
    await updateTurnVector(assistantMessageId, embedding, client);
    console.log('Updated assistant response with embedding');
    
    // Find relevant messages using the embedding
    console.log('Finding relevant messages for the response...');
    relevantMessages = await findSimilarMessages(embedding, topicPathId, 5, assistantMessageId);
    console.log(`Found ${relevantMessages.length} relevant messages`);
    
    if (relevantMessages.length > 0) {
      console.log('First relevant message:', {
        topicId: relevantMessages[0].topicId,
        score: relevantMessages[0].score,
        snippet: relevantMessages[0].content?.substring(0, 50) + '...'
      });
    } else {
      console.log('No relevant messages found. Embedding details:', {
        embeddingType: typeof embedding,
        embeddingIsArray: Array.isArray(embedding),
        embeddingLength: embedding?.length,
        topicId: topicPathId
      });
      
      // Try querying with a very small limit just to check if any messages exist
      console.log('Attempting broader search with no threshold limit...');
      const testMessages = await client.query(
        'SELECT COUNT(*) FROM grp_topic_avatar_turns WHERE content_vector IS NOT NULL AND topic_id != $1',
        [topicPathId]
      );
      console.log('Database has', testMessages.rows[0].count, 'messages with embeddings in other topics');
    }
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
