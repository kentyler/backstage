/**
 * @module routes/api/topicPaths/pathsRetrieval
 * @description API routes for retrieving topic paths
 * This module handles GET operations for topic paths.
 * All routes require authentication via the auth middleware.
 */

import express from 'express';
import { getTopicPaths } from '../../../db/topic-paths/index.js';
import auth from '../../../middleware/auth.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route   GET /api/topic-paths?group_id=123
 * @desc    Get all topic paths for a specific group
 * @access  Private (requires authentication)
 * @returns {Array} Array of topic path objects with their properties
 * @throws  {Error} If database connection fails or query execution fails
 */
router.get('/', async (req, res, next) => {
  try {
    const { group_id } = req.query;
    
    // Validate group_id parameter
    if (!group_id) {
      return next(new ApiError('group_id parameter is required', 400));
    }
    
    const groupId = parseInt(group_id);
    if (isNaN(groupId)) {
      return next(new ApiError('group_id must be a valid number', 400));
    }
    
    console.log('📚 TOPICS: Fetching topic paths for group', groupId);
    
    // Ensure we have a client pool
    if (!req.clientPool) {
      console.error('No client pool available for topic paths request');
      return next(new ApiError('Database connection not available', 500));
    }
    
    // Fetch topic paths for the specified group
    const paths = await getTopicPaths(req.clientPool, groupId);
    
    console.log('📚 TOPICS: Retrieved', paths.length, 'topic paths for group', groupId);
    
    // Return paths array in the expected format
    return res.json({ 
      success: true, 
      topics: paths 
    });
  } catch (error) {
    console.error('Error retrieving topic paths:', error);
    return next(new ApiError('Failed to retrieve topic paths', 500, { cause: error }));
  }
});

export default router;
