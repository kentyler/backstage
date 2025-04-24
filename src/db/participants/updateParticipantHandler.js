/**
 * @file src/api/participants/updateParticipantHandler.js
 * @description Handler for updating a participant.
 */
import { updateParticipant } from '../../db/participant/updateParticipant.js';
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
 * @param {number} [req.body.current_avatar_id] - Updated avatar ID
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
    if (current_avatar_id !== undefined) updates.current_avatar_id = current_avatar_id;
    
    const updatedParticipant = await updateParticipant(Number(req.params.id), updates);
    
    if (!updatedParticipant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    res.json(updatedParticipant);
  } catch (error) {
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(409).json({ error: 'A participant with this email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
}