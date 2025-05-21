import express from 'express';
import { getTurnsByTopicPath, getTurnsByTopicId } from '../../db/grpTopicAvatarTurns/index.js';

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
    const turns = await getTurnsByTopicPath(topicPathId, parseInt(limit), req.clientPool);
    res.json(turns);
  } catch (error) {
    console.error('Error getting topic path turns:', error);
    res.status(500).json({ 
      error: 'Failed to get topic path history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/topics/id/:topicId
 * @desc    Get all turns for a topic using the numeric ID
 * @access  Private
 */
router.get('/id/:topicId', async (req, res) => {
  try {
    const topicId = req.params.topicId;
    const limit = req.query.limit || 100;
    
    if (!topicId || isNaN(Number(topicId))) {
      return res.status(400).json({ error: 'Valid numeric topicId is required' });
    }
    
    // Use the numeric topic ID directly
    try {
      // Get turns directly using the topic ID - pass the pool object correctly
      const pool = req.clientPool;
      const turns = await getTurnsByTopicId(Number(topicId), pool, parseInt(limit));
      res.json(turns);
    } catch (dbError) {
      console.error('Database error getting topic turns:', dbError);
      res.status(500).json({ 
        error: 'Failed to get topic history',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }
  } catch (error) {
    console.error('Error getting turns by topic ID:', error);
    res.status(500).json({ 
      error: 'Failed to get topic history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});



export default router;
