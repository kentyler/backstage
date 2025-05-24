/**
 * @file services/common/storeMessage.js
 * @description Utility to store a message with its vector representation
 */

import { createGrpTopicAvatarTurn } from '../../db/grpTopicAvatarTurns/index.js';
import { generateEmbedding } from '../embeddings.js';

/**
 * Stores a message with its vector representation
 * @param {number} topicPathId - The numeric ID of the topic from the topic_paths table
 * @param {number} avatarId - The ID of the avatar (user/assistant)
 * @param {string} content - The message content
 * @param {boolean} isUser - Whether the message is from the user
 * @param {number|null} llmId - The ID of the LLM used (for assistant messages)
 * @param {number|null} participantId - The ID of the participant (for user messages)
 * @param {Object} pool - Database connection pool
 * @returns {Promise<string|null>} The ID of the stored message or null if failed
 */
export async function storeMessage(
  topicPathId, 
  avatarId, 
  content, 
  isUser = true, 
  llmId = null, 
  participantId = null,
  pool
) {
  if (!topicPathId) throw new Error('topicPathId is required');
  if (!avatarId) throw new Error('avatarId is required');
  if (!content) throw new Error('content is required');
  if (!pool) throw new Error('pool is required');
  
  const numericTopicId = parseInt(topicPathId, 10);
  if (isNaN(numericTopicId)) {
    throw new Error(`Invalid topic ID: ${topicPathId}`);
  }
  
  // Use the common getNextTurnIndex utility
  const { getNextTurnIndex } = await import('./getNextTurnIndex.js');
  
  try {
    // Get the next turn index
    const turnIndex = await getNextTurnIndex(numericTopicId, pool);

    // Only generate embedding for user messages
    let contentVector = null;
    if (isUser) {
      try {
        contentVector = await generateEmbedding(content);
      } catch (error) {
        console.error('Could not generate embedding, storing message without vector:', error.message);
        // Continue without the vector
      }
    }

    // Insert the message using our central function
    let result;
    try {
      const messageTypeId = isUser ? 1 : 2;
      const turnKindId = isUser ? 1 : 2;
      const templateTopicId = null; // This can be updated if needed in the future
      
      const insertResult = await createGrpTopicAvatarTurn(
        numericTopicId,
        avatarId,
        turnIndex,
        content,
        contentVector || null, // Handle the case where contentVector is undefined
        turnKindId,
        messageTypeId,
        templateTopicId,
        pool, // Pass the pool to maintain transaction context
        llmId, // Pass the llm_id
        participantId // Pass the participant_id
      );
      
      // Return the ID of the created turn
      return insertResult.id;
    } catch (error) {
      console.error('Error inserting message:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error storing message:', error);
    throw error;
  }
}
