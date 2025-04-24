/**
 * @file src/api/participants/createParticipantHandler.js
 * @description Handler for creating a new participant.
 */
import { createParticipant } from '../../db/participant/createParticipant.js';
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
    
    const newParticipant = await createParticipant(name, email, hashedPassword);
    res.status(201).json(newParticipant);
  } catch (error) {
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(409).json({ error: 'A participant with this email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
}