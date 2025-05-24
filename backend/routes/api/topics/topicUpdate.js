import express from 'express';
import { updateTopicPath as dbUpdateTopicPath } from '../../../db/topic-paths/index.js';
import auth from '../../../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

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
    
    // Authentication is handled by the auth middleware
    
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

export default router;
