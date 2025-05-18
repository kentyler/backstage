import express from 'express';
import { getConversationTurns, getTurnsByTopicPath } from '../../db/conversationTurns.js';

const router = express.Router();

/**
 * @route   GET /api/conversations/:conversationId/turns
 * @desc    Get all turns for a conversation
 * @access  Private
 */
router.get('/:conversationId/turns', async (req, res) => {
  let client;
  try {
    const { conversationId } = req.params;
    
    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId is required' });
    }
    
    // Get a client from the pool
    client = await req.clientPool.connect();
    
    // Execute the query with the client
    const turns = await getConversationTurns(conversationId, client);
    res.json(turns);
  } catch (error) {
    console.error('Error getting conversation turns:', error);
    res.status(500).json({ 
      error: 'Failed to get conversation history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
    }
  }
});

/**
 * @route   GET /api/conversations/topic/:topicPathId
 * @desc    Get all turns for a topic path
 * @access  Private
 */
router.get('/topic/:topicPathId', async (req, res) => {
  let client;
  try {
    const { topicPathId } = req.params;
    const { limit = 100 } = req.query;
    
    if (!topicPathId) {
      return res.status(400).json({ error: 'topicPathId is required' });
    }
    
    // Get a client from the pool
    client = await req.clientPool.connect();
    
    // Execute the query with the client
    const turns = await getTurnsByTopicPath(topicPathId, client, parseInt(limit));
    res.json(turns);
  } catch (error) {
    console.error('Error getting topic path turns:', error);
    res.status(500).json({ 
      error: 'Failed to get topic path history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
    }
  }
});

export default router;
