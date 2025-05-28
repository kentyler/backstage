/**
 * API route for processing comment messages
 * @module routes/api/promptProcessor/commentProcessor
 */

import express from 'express';
import { pool } from '../../../db/connection.js';
import { processComment } from '../../../services/comments/index.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/llm/prompt
 * @desc    Process a comment message and store it
 * @access  Private
 */
router.post('', async (req, res, next) => {
  let client;
  try {
    const { 
      prompt, 
      topicPathId, 
      avatarId, 
      isComment: isCommentFlag, 
      turn_index 
    } = req.body;
    
    // Only process if this is a comment
    const isExplicitComment = isCommentFlag || 
      prompt.trim().startsWith('comment:') || 
      prompt.trim().startsWith('Comment:');
    
    if (!isExplicitComment) {
      // Not a comment, so skip this middleware
      return next();
    }
    
    // Validate required fields
    if (!topicPathId) {
      return next(new ApiError('topicPathId is required', 400));
    }
    
    if (!avatarId) {
      return next(new ApiError('avatarId is required', 400));
    }
    
    if (!prompt) {
      return next(new ApiError('Comment text is required', 400));
    }
    
    // Get the user's participant ID from the request body or fall back to session
    const participantId = req.body.participantId || req.session?.userId || null;
    console.log('Processing comment with participant ID:', participantId);
    
    // Convert topicPathId to string and trim
    const processedTopicPathId = String(topicPathId).trim();
    
    // Convert avatarId to number
    const processedAvatarId = Number(avatarId);
    
    if (isNaN(processedAvatarId)) {
      return next(new ApiError('avatarId must be a valid number', 400));
    }
    
    // Process the comment
    const commentResult = await processComment(
      prompt, 
      processedTopicPathId, 
      processedAvatarId, 
      participantId, 
      pool, 
      turn_index
    );
    
    if (!commentResult) {
      return next(new ApiError('Failed to process comment', 500));
    }
    
    console.log('Processed comment message with ID:', commentResult.id);
    return res.json(commentResult);
  } catch (error) {
    console.error('Error processing comment:', error);
    return next(new ApiError('Failed to process comment', 500, { 
      cause: error,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }));
  }
});

export default router;
