/**
 * @file src/api/participants/getAllParticipantsHandler.js
 * @description Handler for retrieving all participants.
 */
import { getAllParticipants } from '../../db/participant/getAllParticipants.js';

/**
 * Handles request to get all participants
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getAllParticipantsHandler(req, res) {
  try {
    const participants = await getAllParticipants();
    res.json(participants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}