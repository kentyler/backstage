/**
 * @module routes/api/topicPaths/pathsMessageRetrieval
 * @description API routes for retrieving messages by topic ID
 * This module handles GET operations for retrieving messages associated with topics.
 * All routes require authentication via the auth middleware.
 */

import express from 'express';
import { getTurnsByTopicId } from '../../../db/grpTopicAvatarTurns/index.js';
import auth from '../../../middleware/auth.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route   GET /api/topic-paths/id/:id
 * @desc    Get all turns for a topic using the numeric ID
 * @access  Private (requires authentication)
 * @param   {number} id - The numeric ID of the topic
 * @returns {Array} Array of message turns for the topic
 * @throws  {Error} If database connection fails or query fails
 */
router.get('/id/:id', async (req, res, next) => {
  try {
    const topicId = req.params.id;
    console.log('Fetching messages for topic ID:', topicId);
    
    if (!topicId || isNaN(Number(topicId))) {
      console.log('Error: Valid numeric topicId is required');
      return next(new ApiError('Valid numeric topicId is required', 400));
    }
    
    // Ensure we have a client pool
    if (!req.clientPool) {
      console.error('No client pool available for message retrieval');
      return next(new ApiError('Database connection not available', 500));
    }
    
    // Use the numeric topic ID directly
    try {
      // Use the client-specific pool that's set by the middleware
      // This includes the correct schema search path for the client
      const pool = req.clientPool;
      
      console.log('Using req.clientPool with schema:', req.clientSchema);
      
      // Pass the correct pool to the database function
      const turns = await getTurnsByTopicId(Number(topicId), pool);
      
      // Log the exact data being returned to the client
      console.log('DETAILED RESPONSE DATA:');
      turns.forEach((turn, idx) => {
        console.log(`Turn ${idx}:`, {
          id: turn.id,
          isUser: turn.isUser,
          participantId: turn.participantId,
          participantName: turn.participantName,
          llmId: turn.llmId,
          llmName: turn.llmName
        });
      });
      
      res.json(turns);
    } catch (dbError) {
      console.error('Database error getting topic turns:', dbError);
      return next(new ApiError('Failed to get topic history', 500, { cause: dbError }));
    }
  } catch (error) {
    console.error('Error getting turns by topic ID:', error);
    return next(new ApiError('Failed to get topic history', 500, { cause: error }));
  }
});

export default router;
