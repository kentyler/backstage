/**
 * Topic Preference Creation API Route
 * @module routes/api/preferences/topicPreferenceCreation
 * @description Handles setting the current topic preference for a participant
 */

import express from 'express';
import { createParticipantTopicPreference } from '../../../db/preferences/createParticipantTopicPreference.js';
import { logError, ERROR_SEVERITY, ERROR_SOURCE } from '../../../services/errorLogger.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/preferences/topic
 * @desc    Set current topic preference for the authenticated participant
 * @access  Private (requires authentication via middleware in index.js)
 */
router.post('/topic', async (req, res, next) => {
  try {
    const { topicId } = req.body;
    
    if (!topicId) {
      const error = new ApiError('Topic ID is required', 400);
      await logError(
        error,
        {
          context: 'POST /api/preferences/topic',
          severity: ERROR_SEVERITY.WARNING,
          source: ERROR_SOURCE.BACKEND,
          metadata: { receivedBody: req.body }
        },
        req,
        req.clientPool
      );
      return next(error);
    }
    
    if (!req.session?.userId) {
      const error = new ApiError('Authentication required', 401);
      await logError(
        error,
        {
          context: 'POST /api/preferences/topic',
          severity: ERROR_SEVERITY.WARNING,
          source: ERROR_SOURCE.BACKEND,
          metadata: { authStatus: !!req.session }
        },
        req,
        req.clientPool
      );
      return next(error);
    }
    
    if (!req.clientPool) {
      const error = new ApiError('Database connection unavailable', 500);
      await logError(
        error,
        {
          context: 'POST /api/preferences/topic',
          severity: ERROR_SEVERITY.CRITICAL,
          source: ERROR_SOURCE.BACKEND
        },
        req,
        null // Can't use clientPool here as it's not available
      );
      return next(error);
    }
    
    const preference = await createParticipantTopicPreference(
      req.session.userId,
      topicId,
      req.clientPool
    );
    
    res.status(200).json({
      success: true,
      preference
    });
  } catch (error) {
    await logError(
      error,
      {
        context: 'POST /api/preferences/topic',
        severity: ERROR_SEVERITY.ERROR,
        source: ERROR_SOURCE.BACKEND,
        metadata: { 
          topicId: req.body?.topicId,
          userId: req.session?.userId
        }
      },
      req,
      req.clientPool
    );
    
    return next(new ApiError('Failed to set topic preference', 500, { cause: error }));
  }
});

export default router;
