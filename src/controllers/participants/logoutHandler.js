// src/controllers/participants/logoutHandler.js
import { createParticipantEvent } from '../../db/participantEvents/index.js';

/**
 * Handles participant logout requests and clears the HttpOnly cookie
 */
export async function logoutHandler(req, res) {
  try {
    // Get the participant ID from the authenticated user
    const { participantId } = req.user;

    // Log the logout event (type 4 for logout)
    if (participantId) {
      await createParticipantEvent(participantId, 4, {});
    }

    // Clear the token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict'
    });

    // Send success response
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error.message);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
}