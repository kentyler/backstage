import express from 'express';
import { getTurnsByTopicPath } from '../../db/grpTopicTurns.js';

const router = express.Router();

/**
 * @route   GET /api/topics/:topicPathId/turns
 * @desc    Get all turns for a topic path
 * @access  Private
 */
router.get('/:topicPathId/turns', async (req, res) => {
  let client;
  try {
    const { topicPathId } = req.params;
    const { limit = 100 } = req.query;
    
    if (!topicPathId) {
      return res.status(400).json({ error: 'topicPathId is required' });
    }
    
    // Get a client from the pool
    client = await req.clientPool.connect();
    
    // Execute the query with the client using topic path approach
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

/**
 * @route   GET /api/topics/path/:topicPathId
 * @desc    Get all turns for a topic path
 * @access  Private
 */
router.get('/path/:pathId', async (req, res) => {
  try {
    const topicPathId = req.params.pathId;
    const limit = req.query.limit || 100;
    
    if (!topicPathId) {
      return res.status(400).json({ error: 'topicPathId is required' });
    }
    
    // Use the pool directly - it knows about the schema
    // Pass req.clientPool to the function which will use the schema properly
    const turns = await getTurnsByTopicPath(topicPathId, req.clientPool, parseInt(limit));
    res.json(turns);
  } catch (error) {
    console.error('Error getting topic path turns:', error);
    res.status(500).json({ 
      error: 'Failed to get topic path history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
