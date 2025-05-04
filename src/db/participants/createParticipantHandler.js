/**
 * @file src/api/participants/createParticipantHandler.js
 * @description Handler for creating a new participant.
 */
import { createParticipant } from './createParticipant.js';
import { createParticipantAvatar } from '../participantAvatars/createParticipantAvatar.js';
import { getPreferenceTypeByName } from '../preferences/getPreferenceTypeByName.js';
import { createParticipantPreference } from '../preferences/createParticipantPreference.js';
import bcryptjs from 'bcryptjs';

/**
 * Handles request to create a new participant
 * 
 * @param {object} req - Express request object
 * @param {object} req.body - Request body
 * @param {string} req.body.name - Participant name
 * @param {string} req.body.email - Participant email
 * @param {string} req.body.password - Participant password (will be hashed)
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export async function createParticipantHandler(req, res) {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Hash the password with a salt of 10 rounds
    const hashedPassword = await bcryptjs.hash(password, 10);
    
    // Create the participant
    const newParticipant = await createParticipant(name, email, hashedPassword);
    
    // Default avatar ID
    const defaultAvatarId = 1;
    
    try {
      // Create participant-avatar relationship
      await createParticipantAvatar(newParticipant.id, defaultAvatarId);
      
      // Get the preference type ID for 'avatar_id'
      const avatarPreferenceType = await getPreferenceTypeByName('avatar_id');
      
      if (avatarPreferenceType) {
        // Set the avatar_id preference for the participant
        await createParticipantPreference(
          newParticipant.id,
          avatarPreferenceType.id,
          defaultAvatarId
        );
      }
    } catch (avatarError) {
      console.error('Failed to create avatar for participant:', avatarError.message);
      // Continue with the response even if avatar creation fails
      // This ensures the participant is still created
    }
    
    res.status(201).json(newParticipant);
  } catch (error) {
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(409).json({ error: 'A participant with this email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
}