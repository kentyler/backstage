import express from 'express';
import { createTopicPath } from '../../../db/topic-paths/index.js';
import auth from '../../../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route   POST /api/topics
 * @desc    Create a new topic path
 * @access  Private
 */
router.post('', async (req, res) => {
  try {
    console.log('Received create topic request with body:', req.body);
    const { path } = req.body;
    
    if (!path) {
      console.log('Error: Path is required');
      return res.status(400).json({ error: 'Path is required' });
    }
    
    // Authentication is handled by the auth middleware
    
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

export default router;
