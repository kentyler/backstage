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
 * @route   GET /api/topic-paths
 * @desc    Get all topic paths from the database
 * @access  Private (requires authentication)
 * @returns {Array} Array of topic path objects with their properties
 * @throws  {Error} If database connection fails or query execution fails
 */
router.get('/', async (req, res, next) => {
  try {
    // Log the client pool to help with debugging
    console.log('Fetching topic paths with client pool:', req.clientPool ? 'Present' : 'Missing');
    
    // Ensure we have a client pool
    if (!req.clientPool) {
      console.error('No client pool available for topic paths request');
      return next(new ApiError('Database connection not available', 500));
    }
    
    // Authentication is handled by the auth middleware
    const paths = await getTopicPaths(req.clientPool);
    
    // Return paths array directly to match what the frontend expects
    return res.json(paths);
  } catch (error) {
    console.error('Error retrieving topic paths:', error);
    return next(new ApiError('Failed to retrieve topic paths', 500, { cause: error }));
  }
});

export default router;
