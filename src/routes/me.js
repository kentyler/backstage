// src/routes/me.js
/**
 * Route module for authenticated user info.
 *
 * @module routes/me
 */
import express from 'express';
import { authWithSchema } from '../middleware/authWithSchema.js';
import { getParticipantById } from '../db/participants/index.js';
import { getPreferenceWithFallback } from '../db/preferences/getPreferenceWithFallback.js';
import { getAvailableLLMs, getLLMId } from '../services/llmService.js';

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
router.get('/', authWithSchema, async (req, res) => {
  try {
    // Get participant ID from the JWT payload
    const { participantId } = req.user;
    
    if (!participantId) {
      return res.json({ user: req.user });
    }
    
    // Get client schema from the request (set by setClientSchema middleware)
    const schema = req.clientSchema || 'public';
    
    // Fetch participant details from the database using the client schema
    const participant = await getParticipantById(participantId, schema);
    
    if (!participant) {
      return res.json({ user: req.user });
    }
    
    // Remove sensitive information
    const { password, ...safeParticipant } = participant;
    
    // Get the participant's avatar ID from preferences
    try {
      const avatarIdPreference = await getPreferenceWithFallback('avatar_id', {
        participantId: participantId,
        schema: schema // Pass the client schema to getPreferenceWithFallback
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
    
    // Get the participant's current LLM ID from preferences
    let currentLLMId = null;
    try {
      currentLLMId = await getLLMId(participantId, null, schema);
      console.log(`Retrieved current LLM ID for participant ${participantId}: ${currentLLMId}`);
      safeParticipant.current_llm_id = currentLLMId;
    } catch (llmError) {
      console.error(`Error retrieving current LLM ID for participant ${participantId}:`, llmError.message);
      // Don't fail the request if we can't get the LLM ID, just log the error
    }
    
    // Get available LLMs for the client schema
    let availableLLMs = [];
    try {
      // Use the schema name as the subdomain for the getAvailableLLMs function
      availableLLMs = await getAvailableLLMs(schema);
      console.log(`Retrieved ${availableLLMs.length} available LLMs for schema ${schema}`);
    } catch (llmsError) {
      console.error(`Error retrieving available LLMs for schema ${schema}:`, llmsError.message);
      // Don't fail the request if we can't get the available LLMs, just log the error
    }
    
    // Return the JWT payload, participant details, and available LLMs
    res.json({ 
      user: {
        ...req.user,
        participant: safeParticipant
      },
      availableLLMs: availableLLMs
    });
  } catch (error) {
    console.error('Error fetching participant details:', error);
    res.status(500).json({ error: 'Failed to fetch participant details' });
  }
});

export default router;
