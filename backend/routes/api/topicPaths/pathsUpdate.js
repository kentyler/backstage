/**
 * @module routes/api/topicPaths/pathsUpdate
 * @description API routes for updating topic paths
 * This module handles PUT operations for topic paths.
 * All routes require authentication via the auth middleware.
 */

import express from 'express';
import { updateTopicPath } from '../../../db/topic-paths/index.js';
import auth from '../../../middleware/auth.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route   PUT /api/topic-paths/:oldPath
 * @desc    Update a specific topic path
 * @access  Private (requires authentication)
 * @param   {string} oldPath - The current topic path to update
 * @param   {string} newPath - The new path value (in request body)
 * @returns {Object} Updated topic path object
 * @throws  {Error} If database connection fails or update fails
 */
router.put('/:oldPath(*)', async (req, res, next) => {
  try {
    const { oldPath } = req.params;
    const { newPath } = req.body;
    
    if (!oldPath) {
      console.log('Error: Old path parameter is required');
      return next(new ApiError('Old path parameter is required', 400));
    }
    
    if (!newPath) {
      console.log('Error: New path is required in request body');
      return next(new ApiError('New path is required in request body', 400));
    }
    
    // Ensure we have a client pool
    if (!req.clientPool) {
      console.error('No client pool available for topic path update');
      return next(new ApiError('Database connection not available', 500));
    }
    
    // Authentication is handled by the auth middleware
    try {
      console.log(`Attempting to update topic path from ${oldPath} to ${newPath}`);
      const updated = await updateTopicPath(oldPath, newPath, req.session.userId, req.clientPool);
      console.log('Successfully updated topic path:', updated);
      
      return res.json({ 
        success: true, 
        message: 'Topic path updated successfully',
        topicPath: updated
      });
    } catch (dbError) {
      console.error('Database error updating topic path:', dbError);
      return next(new ApiError('Failed to update topic path', 500, { cause: dbError }));
    }
  } catch (error) {
    console.error('Error in update topic path endpoint:', error);
    return next(new ApiError('Failed to process update request', 500, { cause: error }));
  }
});

export default router;
