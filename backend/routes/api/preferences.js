/**
 * @module routes/api/preferences
 * @description API routes for user preferences operations
 * This module handles setting and retrieving user preferences, specifically
 * for managing which topic a participant is currently viewing or interacting with.
 * All routes require authentication via the auth middleware.
 */

import express from 'express';
import { createParticipantTopicPreference } from '../../db/preferences/createParticipantTopicPreference.js';
import { getCurrentParticipantTopic } from '../../db/preferences/getCurrentParticipantTopic.js';
import auth from '../../middleware/auth.js';

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
      return res.status(400).json({ error: 'Topic ID is required' });
    }
    
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
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
    console.error('Error setting topic preference:', error);
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
