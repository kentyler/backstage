/**
 * Current Topic Retrieval API Route
 * @module routes/api/preferences/currentTopicRetrieval
 * @description Handles retrieving the current topic preference for a participant
 */

import express from 'express';
import { getCurrentParticipantTopic } from '../../../db/preferences/getCurrentParticipantTopic.js';
import { logError, ERROR_SEVERITY, ERROR_SOURCE } from '../../../services/errorLogger.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   GET /api/preferences/current-topic
 * @desc    Get the current (most recently selected) topic preference for the authenticated participant
 * @access  Private (requires authentication via middleware in index.js)
 */
router.get('/current-topic', async (req, res, next) => {
  try {
    if (!req.session?.userId) {
      return next(new ApiError('Authentication required', 401));
    }
    
    // Ensure we have a client pool
    if (!req.clientPool) {
      console.error('No client pool available for current topic retrieval');
      return next(new ApiError('Database connection not available', 500));
    }
    
    const currentTopic = await getCurrentParticipantTopic(
      req.session.userId,
      req.clientPool
    );
    
    res.status(200).json({
      success: true,
      currentTopic
    });
  } catch (error) {
    console.error('Error getting current topic preference:', error);
    await logError(
      error,
      {
        context: 'GET /api/preferences/current-topic',
        severity: ERROR_SEVERITY.ERROR,
        source: ERROR_SOURCE.BACKEND,
        metadata: { 
          userId: req.session?.userId
        }
      },
      req,
      req.clientPool
    );
    return next(new ApiError('Failed to get current topic preference', 500, { cause: error }));
  }
});

export default router;
