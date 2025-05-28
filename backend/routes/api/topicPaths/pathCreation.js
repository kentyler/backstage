/**
 * @module routes/api/topicPaths/pathCreation
 * @description API routes for creating topic paths
 * This module handles POST operations for topic paths.
 * All routes require authentication via the auth middleware.
 */

import express from 'express';
import { createTopicPath } from '../../../db/topic-paths/index.js';
import auth from '../../../middleware/auth.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route   POST /api/topic-paths
 * @desc    Create a new topic path
 * @access  Private (requires authentication)
 * @param   {string} path - The topic path to create (in request body)
 * @returns {Object} Newly created topic path object
 * @throws  {Error} If database connection fails or creation fails
 */
router.post('', async (req, res, next) => {
  try {
    console.log('Received create topic request with body:', req.body);
    const { path } = req.body;
    
    if (!path) {
      console.log('Error: Path is required');
      return next(new ApiError('Path is required', 400));
    }
    
    // Ensure we have a client pool
    if (!req.clientPool) {
      console.error('No client pool available for topic path creation');
      return next(new ApiError('Database connection not available', 500));
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
      return next(new ApiError('Failed to create topic path', 500, { cause: dbError }));
    }
  } catch (error) {
    console.error('Error in create topic endpoint:', error);
    return next(new ApiError('Failed to create topic path', 500, { cause: error }));
  }
});

export default router;
