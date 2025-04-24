/**
 * @file src/api/participants/loginHandler.js
 * @description Handler for participant authentication.
 */
import { getParticipantByEmail } from '../../db/participant/getParticipantByEmail.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Handles participant login requests
 * 
 * @param {object} req - Express request object
 * @param {object} req.body - Request body
 * @param {string} req.body.email - Participant email
 * @param {string} req.body.password - Participant password
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export async function loginHandler(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find participant by email
    const participant = await getParticipantByEmail(email);
    
    if (!participant) {
      // Use a generic error message to prevent email enumeration
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Compare the provided password with the stored hash
    const isPasswordValid = await bcryptjs.compare(password, participant.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Password is valid, return participant data (excluding password)
    const { password: _, ...participantData } = participant;
    
    const token = jwt.sign(
      { participantId: participant.id, email: participant.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ participant: participantData, token });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}