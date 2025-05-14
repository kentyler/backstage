/**
 * @file src/api/participants/getParticipantsByGroupHandler.js
 * @description Handler for retrieving all participants in a group.
 */
import { getParticipantsByGroup } from '../../db/participant/getParticipantsByGroup.js';

/**
 * Handles request to get all participants in a group
 * 
 * @param {object} req - Express request object
 * @param {object} req.params - Request parameters
 * @param {string} req.params.groupId - Group ID
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getParticipantsByGroupHandler(req, res) {
  try {
    const participants = await getParticipantsByGroup(Number(req.params.groupId));
    res.json(participants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}