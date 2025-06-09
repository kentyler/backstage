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
 * @route   PUT /api/topic-paths
 * @desc    Update a specific topic path for a group
 * @access  Private (requires authentication)
 * @param   {string} old_path - The current topic path to update (in request body)
 * @param   {string} new_path - The new path value (in request body)
 * @param   {number} group_id - The group ID the topic belongs to (in request body)
 * @returns {Object} Updated topic path object
 * @throws  {Error} If database connection fails or update fails
 */
router.put('/', async (req, res, next) => {
  try {
    console.log('📚 TOPICS: Received update topic request with body:', req.body);
    const { old_path, new_path, group_id } = req.body;
    
    // Validate required fields
    if (!old_path || !old_path.trim()) {
      return next(new ApiError('old_path is required', 400));
    }
    
    if (!new_path || !new_path.trim()) {
      return next(new ApiError('new_path is required', 400));
    }
    
    if (!group_id) {
      return next(new ApiError('group_id is required', 400));
    }
    
    const groupId = parseInt(group_id);
    if (isNaN(groupId)) {
      return next(new ApiError('group_id must be a valid number', 400));
    }
    
    // Ensure we have a client pool
    if (!req.clientPool) {
      console.error('No client pool available for topic path update');
      return next(new ApiError('Database connection not available', 500));
    }
    
    try {
      console.log(`📚 TOPICS: Updating topic path from ${old_path} to ${new_path} for group ${groupId}`);
      
      // Pass parameters in the correct order: pool, oldPath, newPath, groupId
      const updated = await updateTopicPath(req.clientPool, old_path.trim(), new_path.trim(), groupId);
      console.log('📚 TOPICS: Successfully updated topic path:', updated);
      
      return res.json({ 
        success: true, 
        message: 'Topic path updated successfully',
        result: updated
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
