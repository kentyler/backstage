import express from 'express';
import { getTurnsByTopicId } from '../../db/grpTopicAvatarTurns/index.js';
import { 
  createTopicPath, 
  deleteTopicPath as dbDeleteTopicPath, 
  updateTopicPath as dbUpdateTopicPath,
  getTopicPaths
} from '../../db/topic-paths/index.js';

const router = express.Router();

/**
 * @route   POST /api/topics
 * @desc    Create a new topic path
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    console.log('Received create topic request with body:', req.body);
    const { path } = req.body;
    
    if (!path) {
      console.log('Error: Path is required');
      return res.status(400).json({ error: 'Path is required' });
    }
    
    if (!req.session.userId) {
      console.log('Error: Not authenticated');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
      console.log(`Creating topic path: ${path} for user: ${req.session.userId}`);
      // Pass parameters in the correct order: path, userId, pool
      const newPath = await createTopicPath(path, req.session.userId, req.clientPool);
      console.log('Successfully created topic path:', newPath);
      return res.status(201).json(newPath);
    } catch (dbError) {
      console.error('Database error creating topic path:', dbError);
      throw dbError; // This will be caught by the outer catch
    }
  } catch (error) {
    console.error('Error in create topic endpoint:', error);
    // Ensure we always return a valid JSON response
    res.status(500).json({ 
      error: 'Failed to create topic path',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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



/**
 * @route   GET /api/topics
 * @desc    Get all topic paths
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const topics = await getTopicPaths(req.clientPool);
    res.json(topics);
  } catch (error) {
    console.error('Error fetching topic paths:', error);
    res.status(500).json({ 
      error: 'Failed to fetch topic paths',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/topics/:oldPath
 * @desc    Update a topic path
 * @access  Private
 */
router.put('/:oldPath', async (req, res) => {
  try {
    const { oldPath } = req.params;
    const { path: newPath } = req.body;
    
    if (!newPath) {
      return res.status(400).json({ error: 'New path is required' });
    }
    
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const updatedPath = await dbUpdateTopicPath(oldPath, newPath, req.session.userId, req.clientPool);
    res.json(updatedPath);
  } catch (error) {
    console.error('Error updating topic path:', error);
    res.status(500).json({ 
      error: 'Failed to update topic path',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/topics/:path(*)
 * @desc    Delete a topic path
 * @access  Private
 */
router.delete('/:path(*)', async (req, res) => {
  try {
    console.log('Received delete request for path:', req.params.path);
    const path = req.params.path;
    
    if (!path) {
      console.log('Error: Path is required');
      return res.status(400).json({ error: 'Path is required' });
    }
    
    if (!req.session.userId) {
      console.log('Error: Not authenticated');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Decode the path in case it contains encoded characters
    const decodedPath = decodeURIComponent(path);
    console.log('Decoded path:', decodedPath);
    
    try {
      console.log('Attempting to delete topic path:', decodedPath);
      // Pass the pool first, then the path
      const result = await dbDeleteTopicPath(req.clientPool, decodedPath);
      console.log('Successfully deleted topic path:', result);
      return res.status(204).send();
    } catch (dbError) {
      console.error('Database error deleting topic path:', {
        error: dbError.message,
        stack: dbError.stack,
        path: decodedPath,
        userId: req.session.userId
      });
      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Error in delete topic endpoint:', {
      error: error.message,
      stack: error.stack,
      path: req.params.path,
      userId: req.session?.userId
    });
    
    res.status(500).json({ 
      error: 'Failed to delete topic path',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
    });
  }
});

export default router;
