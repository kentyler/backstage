/**
 * @file src/db/participants/getParticipantByEmailHandler.js
 * @description Handler for retrieving a participant by email.
 */
import { getParticipantByEmail } from './getParticipantByEmail.js';

/**
 * Handles request to get a participant by email
 * 
 * @param {object} req - Express request object
 * @param {object} req.query - Request query parameters
 * @param {string} req.query.email - Participant email
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getParticipantByEmailHandler(req, res) {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const participant = await getParticipantByEmail(email);
    
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    res.json(participant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
