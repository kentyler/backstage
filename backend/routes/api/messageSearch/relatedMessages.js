/**
 * API route for finding messages related to a specific message
 * @module routes/api/messageSearch/relatedMessages
 */

import express from 'express';
import { pool } from '../../../db/connection.js';
import { generateEmbedding } from '../../../services/embeddings.js';
import { findSimilarMessages } from '../../../db/messageSearch.js';
import { updateTurnVector, getTurnById } from '../../../db/grpTopicAvatarTurns/index.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   GET /api/message-search/messages/:messageId/related
 * @desc    Get messages related to a specific message
 * @access  Private (requires authentication via middleware in index.js)
 */
router.get('/messages/:messageId/related', async (req, res, next) => {
  const { messageId } = req.params;
  const { limit = 5 } = req.query;
  
  if (!messageId) {
    return next(new ApiError('Message ID is required', 400));
  }

  let client;
  
  try {
    client = await pool.connect();
    
    // 1. Get the message and its embedding
    const message = await getTurnById(Number(messageId), client);
    
    if (!message) {
      return next(new ApiError(`Message with ID ${messageId} not found`, 404));
    }
    
    let embedding = message.content_vector;

    // If no embedding exists, generate one
    if (!embedding) {
      embedding = await generateEmbedding(message.content_text);
      await updateTurnVector(Number(messageId), embedding, client);
    } else if (typeof embedding === 'string') {
      // If embedding is a string, parse it to an array
      try {
        embedding = JSON.parse(embedding);
      } catch (e) {
        console.error('Error parsing embedding string:', e);
        // If parsing fails, generate a new embedding
        embedding = await generateEmbedding(message.content_text);
        await updateTurnVector(Number(messageId), embedding, client);
      }
    }
    
    // 2. Find similar messages
    const similarMessages = await findSimilarMessages(
      embedding,
      message.topic_id,
      Number(limit),
      Number(messageId) // Exclude the current message
    );
    
    res.json(similarMessages);
  } catch (error) {
    console.error('Error finding related messages:', error);
    return next(new ApiError('Failed to find related messages', 500, { 
      cause: error,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }));
  } finally {
    if (client) client.release();
  }
});

export default router;
