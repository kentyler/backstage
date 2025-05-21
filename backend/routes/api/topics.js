import express from 'express';
import { getTurnsByTopicId } from '../../db/grpTopicAvatarTurns/index.js';
import { createTopicPath } from '../../db/topic-paths/index.js';

const router = express.Router();

/**
 * @route   POST /api/topics
 * @desc    Create a new topic path
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { path } = req.body;
    
    if (!path) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const newPath = await createTopicPath(path, req.session.userId, req.clientPool);
    res.status(201).json(newPath);
  } catch (error) {
    console.error('Error creating topic path:', error);
    res.status(500).json({ 
      error: 'Failed to create topic path',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/topics/id/:topicId
 * @desc    Get all turns for a topic using the numeric ID
 * @access  Private
 */
router.get('/id/:id', async (req, res) => {
  try {
    const topicId = req.params.id;
    console.log('Fetching messages for topic ID:', topicId);
    
    if (!topicId || isNaN(Number(topicId))) {
      console.log('Error: Valid numeric topicId is required');
      return res.status(400).json({ error: 'Valid numeric topicId is required' });
    }
    
    // Use the numeric topic ID directly
    try {
      // Use the client-specific pool that's set by the middleware
      // This includes the correct schema search path for the client
      const pool = req.clientPool;
      const limit = req.query.limit || 100;
      
      console.log('Using req.clientPool with schema:', req.clientSchema);
      
      // Pass the correct pool to the database function
      const turns = await getTurnsByTopicId(Number(topicId), pool, parseInt(limit));
      
      // Log the exact data being returned to the client
      console.log('DETAILED RESPONSE DATA:');
      turns.forEach((turn, idx) => {
        console.log(`Turn ${idx}:`, {
          id: turn.id,
          isUser: turn.isUser,
          participantId: turn.participantId,
          participantName: turn.participantName,
          llmId: turn.llmId,
          llmName: turn.llmName
        });
      });
      
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
