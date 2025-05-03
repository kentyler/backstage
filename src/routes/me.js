// src/routes/me.js
/**
 * Route module for authenticated user info.
 *
 * @module routes/me
 */
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getParticipantById } from '../db/participants/index.js';
import { getPreferenceWithFallback } from '../db/preferences/getPreferenceWithFallback.js';

const router = express.Router();

/**
 * GET /api/me
 *
 * Returns the authenticated user's information including participant details.
 * Requires a valid JWT or session via requireAuth middleware.
 *
 * @name GetMe
 * @route {GET} /api/me
 * @middleware requireAuth
 * @returns {Object} 200 - User object with participant details
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    // Get participant ID from the JWT payload
    const { participantId } = req.user;
    
    if (!participantId) {
      return res.json({ user: req.user });
    }
    
    // Fetch participant details from the database
    const participant = await getParticipantById(participantId);
    
    if (!participant) {
      return res.json({ user: req.user });
    }
    
    // Remove sensitive information
    const { password, ...safeParticipant } = participant;
    
    // Get the participant's avatar ID from preferences
    try {
      const avatarIdPreference = await getPreferenceWithFallback('avatar_id', {
        participantId: participantId
      });
      console.log(`Retrieved avatar_id preference for participant ${participantId}:`, avatarIdPreference);
      
      // Add the current_avatar_id to the participant data from preferences
      if (avatarIdPreference && avatarIdPreference.value) {
        safeParticipant.current_avatar_id = avatarIdPreference.value;
        console.log(`Set current_avatar_id to ${safeParticipant.current_avatar_id} for participant ${participantId}`);
      } else {
        // Throw an error if no avatar ID preference is found
        throw new Error(`No avatar_id preference found for participant ${participantId}`);
      }
    } catch (prefError) {
      console.error(`Error retrieving avatar_id preference for participant ${participantId}:`, prefError.message);
      return res.status(500).json({ 
        error: 'Failed to retrieve avatar ID preference', 
        details: prefError.message 
      });
    }
    
    // Return both the JWT payload and participant details
    res.json({ 
      user: {
        ...req.user,
        participant: safeParticipant
      }
    });
  } catch (error) {
    console.error('Error fetching participant details:', error);
    res.status(500).json({ error: 'Failed to fetch participant details' });
  }
});

export default router;
