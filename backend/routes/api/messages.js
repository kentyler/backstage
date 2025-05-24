import express from 'express';
import { pool } from '../../db/connection.js';
import { generateEmbedding } from '../../services/embeddings.js';
import { findSimilarMessages } from '../../db/messageSearch.js';
import { updateTurnVector, getTurnById } from '../../db/grpTopicAvatarTurns/index.js';
import auth from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route   GET /api/messages/:messageId/related
 * @desc    Get messages related to a specific message
 * @access  Private
 */
router.get('/:messageId/related', async (req, res) => {
  const { messageId } = req.params;
  const { limit = 5 } = req.query;
  
  if (!messageId) {
    return res.status(400).json({ error: 'Message ID is required' });
  }

  const client = await pool.connect();
  
  try {
    // 1. Get the message and its embedding
    const message = await getTurnById(Number(messageId), client);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
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
    res.status(500).json({ 
      error: 'Failed to find related messages',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
});

export default router;
