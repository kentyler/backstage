// src/controllers/participants/loginHandler.js
import { getParticipantByEmail } from '../../db/participants/getParticipantByEmail.js';
import bcryptjs from 'bcryptjs';
import { signToken } from '../../services/authService.js';
import { createParticipantEvent } from '../../db/participantEvents/index.js';

// System participant ID for logging events not associated with a specific participant
const SYSTEM_PARTICIPANT_ID = 815; // Special participant created for system events

/**
 * Handles participant login requests and sets an HttpOnly cookie
 */
export async function loginHandler(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const participant = await getParticipantByEmail(email);
    if (!participant) {
      // Log unsuccessful login attempt (participant not found - type 3)
      // Using system participant ID since the database requires a valid participant_id
      await createParticipantEvent(SYSTEM_PARTICIPANT_ID, 3, { email, password });
      return res.status(401).json({ error: 'Login failed.' });
    }

    const isPasswordValid = await bcryptjs.compare(password, participant.password);
    if (!isPasswordValid) {
      // Log unsuccessful login attempt (invalid password - type 2)
      await createParticipantEvent(participant.id, 2, { email, password });
      return res.status(401).json({ error: 'Login failed.' });
    }

    // Log successful login (type 1)
    await createParticipantEvent(participant.id, 1, { email });

    const { password: _, ...participantData } = participant;
    const token = signToken({ participantId: participant.id });

    // Set JWT in an HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    // Initialize the LLM service with the participant's LLM configuration
    try {
      const { initLLMService } = await import('../../services/llmService.js');
      await initLLMService(participant.id);
    } catch (llmError) {
      console.warn(`Failed to initialize LLM service for participant ${participant.id}: ${llmError.message}`);
      // Continue with login even if LLM initialization fails
    }

    // Send back participant (token is in cookie)
    res.json({ participant: participantData });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
}
