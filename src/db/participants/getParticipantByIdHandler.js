/**
 * @file src/api/participants/getParticipantByIdHandler.js
 * @description Handler for retrieving a participant by ID.
 */
import { getParticipantById } from '../../db/participant/getParticipantById.js';

/**
 * Handles request to get a participant by ID
 * 
 * @param {object} req - Express request object
 * @param {object} req.params - Request parameters
 * @param {string} req.params.id - Participant ID
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getParticipantByIdHandler(req, res) {
  try {
    const participant = await getParticipantById(Number(req.params.id));
    
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    res.json(participant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}