/**
 * API route for creating comments
 * @module routes/api/comments/commentCreation
 */

import express from 'express';
import { pool } from '../../../db/connection.js';
import { storeComment } from '../../../services/comments/index.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/comments
 * @desc    Create a new comment without triggering LLM response
 * @access  Private (authentication applied in index.js)
 */
router.post('', async (req, res, next) => {
  let client;
  try {
    const { content, topicPathId, avatarId, turn_index, referenceMessageId, turn_kind_id } = req.body;
    
    // Ensure turn_kind_id is set to 3 for comments
    const commentTurnKindId = turn_kind_id || 3; // Default to 3 if not provided
    
    console.log('Comment API received:', { 
      content, 
      topicPathId, 
      avatarId, 
      turn_index, 
      referenceMessageId, 
      turn_kind_id: commentTurnKindId 
    });
    
    // Validate required fields
    if (!topicPathId) {
      return next(new ApiError('topicPathId is required', 400));
    }
    
    if (!avatarId) {
      return next(new ApiError('avatarId is required', 400));
    }
    
    if (!content) {
      return next(new ApiError('Content is required for comments', 400));
    }
    
    // Convert topicPathId to string and trim
    const cleanTopicPathId = String(topicPathId).trim();
    
    // Convert avatarId to number
    const cleanAvatarId = Number(avatarId);
    if (isNaN(cleanAvatarId)) {
      return next(new ApiError('avatarId must be a valid number', 400));
    }
    
    // Get the user's participant ID from the request body or fall back to session
    const participantId = req.body.participantId || req.session?.userId || null;
    
    // Get a client from the pool
    client = await pool.connect();
    
    // Set the schema if needed (assuming 'dev' schema for now)
    await client.query('SET search_path TO dev, public');
    
    // Store the comment with the specified turn_index and turn_kind_id for proper positioning
    const comment = await storeComment(
      cleanTopicPathId, 
      cleanAvatarId, 
      content, 
      participantId, 
      pool,
      turn_index, // Pass the turn_index to ensure comment appears in the right position
      commentTurnKindId // Pass the turn_kind_id (3 for comments)
    );
    
    console.log('Comment stored with turn_index:', turn_index);
    
    // Return success with the created comment
    return res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: comment
    });
    
  } catch (error) {
    console.error('Error in POST /api/comments:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    return next(new ApiError('Failed to process comment', 500, {
      cause: error,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }));
  } finally {
    if (client) {
      client.release();
    }
  }
});

export default router;
