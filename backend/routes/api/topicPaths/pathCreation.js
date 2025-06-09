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
 * @desc    Create a new topic path for a specific group
 * @access  Private (requires authentication)
 * @param   {string} path - The topic path to create (in request body)
 * @param   {number} group_id - The group ID the topic belongs to (in request body)
 * @param   {number} participant_id - The participant creating the topic (in request body)
 * @returns {Object} Newly created topic path object
 * @throws  {Error} If database connection fails or creation fails
 */
router.post('', async (req, res, next) => {
  try {
    console.log('📚 TOPICS: Received create topic request with body:', req.body);
    const { path, group_id, participant_id } = req.body;
    
    // Validate required fields
    if (!path || !path.trim()) {
      return next(new ApiError('Path is required', 400));
    }
    
    if (!group_id) {
      return next(new ApiError('group_id is required', 400));
    }
    
    if (!participant_id) {
      return next(new ApiError('participant_id is required', 400));
    }
    
    const groupId = parseInt(group_id);
    const participantId = parseInt(participant_id);
    
    if (isNaN(groupId)) {
      return next(new ApiError('group_id must be a valid number', 400));
    }
    
    if (isNaN(participantId)) {
      return next(new ApiError('participant_id must be a valid number', 400));
    }
    
    // Ensure we have a client pool
    if (!req.clientPool) {
      console.error('No client pool available for topic path creation');
      return next(new ApiError('Database connection not available', 500));
    }
    
    try {
      console.log(`📚 TOPICS: Creating topic path: ${path} for group ${groupId} by participant ${participantId}`);
      
      // Pass parameters in the correct order: pool, path, groupId, userId
      const newPath = await createTopicPath(req.clientPool, path.trim(), groupId, participantId);
      console.log('📚 TOPICS: Successfully created topic path:', newPath);
      
      return res.status(201).json({
        success: true,
        topic: newPath
      });
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
