/**
 * @file src/api/participants/deleteParticipantHandler.js
 * @description Handler for deleting a participant.
 */
import { deleteParticipant } from '../../db/participant/deleteParticipant.js';

/**
 * Handles request to delete a participant
 * 
 * @param {object} req - Express request object
 * @param {object} req.params - Request parameters
 * @param {string} req.params.id - Participant ID
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export async function deleteParticipantHandler(req, res) {
  try {
    const deleted = await deleteParticipant(Number(req.params.id));
    
    if (!deleted) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}