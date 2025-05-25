/**
 * @module routes/api/preferences
 * @description API routes for user preferences operations
 * This module handles setting and retrieving user preferences, specifically
 * for managing which topic a participant is currently viewing or interacting with.
 * All routes require authentication via the auth middleware.
 */

import express from 'express';
import auth from '../../middleware/auth.js';
import { createParticipantTopicPreference } from '../../db/preferences/createParticipantTopicPreference.js';
import { getCurrentParticipantTopic } from '../../db/preferences/getCurrentParticipantTopic.js';
import { logError, ERROR_SEVERITY, ERROR_SOURCE } from '../../services/errorLogger.js';

const router = express.Router();

/**
 * @route   POST /api/preferences/topic
 * @desc    Set current topic preference for the authenticated participant
 * @access  Private (requires authentication)
 * @param   {Object} req.body - The request body
 * @param   {number} req.body.topicId - The ID of the topic to set as current
 * @returns {Object} Success message and the created preference object
 * @throws  {Error} If topic ID is missing, user is not authenticated, or database operation fails
 */
router.post('/topic', auth, async (req, res) => {
  try {
    const { topicId } = req.body;
    
    if (!topicId) {
      const error = new Error('Topic ID is required');
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
      return res.status(400).json({ error: error.message });
    }
    
    if (!req.session?.userId) {
      const error = new Error('Authentication required');
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
      return res.status(401).json({ error: error.message });
    }
    
    if (!req.clientPool) {
      const error = new Error('Database connection unavailable');
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
      return res.status(500).json({ error: error.message });
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
    
    res.status(500).json({ error: 'Failed to set topic preference' });
  }
});

/**
 * @route   GET /api/preferences/current-topic
 * @desc    Get the current (most recently selected) topic preference for the authenticated participant
 * @access  Private (requires authentication)
 * @returns {Object} Object containing the current topic preference with topic details
 * @throws  {Error} If user is not authenticated or database operation fails
 */
router.get('/current-topic', auth, async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
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
    res.status(500).json({ error: 'Failed to get current topic preference' });
  }
});

export default router;
