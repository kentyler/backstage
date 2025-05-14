/**
 * @file src/db/participants/updateParticipantHandler.js
 * @description Handler for updating a participant.
 */
import { updateParticipant } from './updateParticipant.js';
import bcryptjs from 'bcryptjs';

/**
 * Handles request to update a participant
 * 
 * @param {object} req - Express request object
 * @param {object} req.params - Request parameters
 * @param {string} req.params.id - Participant ID
 * @param {object} req.body - Request body
 * @param {string} [req.body.name] - Updated name
 * @param {string} [req.body.email] - Updated email
 * @param {string} [req.body.password] - Updated password (will be hashed)
 * @param {object} req.user - Authenticated user information
 * @param {number} req.user.participantId - ID of the authenticated participant
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export async function updateParticipantHandler(req, res) {
  try {
    const { name, email, password, current_avatar_id } = req.body;
    const updates = {};
    
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (password !== undefined) {
      // Hash the new password
      updates.password = await bcryptjs.hash(password, 10);
    }
    
    // If current_avatar_id is provided, update the preference instead
    if (current_avatar_id !== undefined) {
      try {
        const { getPreferenceTypeByName } = await import('../preferences/getPreferenceTypeByName.js');
        const { createParticipantPreference } = await import('../preferences/createParticipantPreference.js');
        
        // Get the preference type ID for current_avatar
        const preferenceType = await getPreferenceTypeByName('current_avatar');
        if (preferenceType) {
          // Create or update the preference
          await createParticipantPreference(
            Number(req.params.id),
            'current_avatar',
            { avatar_id: current_avatar_id }
          );
          console.log(`Updated avatar preference for participant ${req.params.id} to ${current_avatar_id}`);
        } else {
          console.warn(`Preference type 'current_avatar' not found, cannot update avatar preference`);
        }
      } catch (prefError) {
        console.error(`Error updating avatar preference: ${prefError.message}`);
        // Continue with the update even if preference update fails
      }
    }
    
    // Get the ID of the authenticated user making the change
    const createdByParticipantId = req.user?.participantId || null;
    
    const updatedParticipant = await updateParticipant(
      Number(req.params.id), 
      updates,
      createdByParticipantId
    );
    
    if (!updatedParticipant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    res.json(updatedParticipant);
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: 'A participant with this email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
}