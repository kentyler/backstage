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
      // Use the client pool from the request object
      await createParticipantEvent(participantId, 4, {}, req.clientPool);
    }

    // Clear the token cookie
    // Extract the parent domain from the request hostname for subdomain support
    const hostname = req.hostname;
    // Get the base domain (e.g., example.com from subdomain.example.com)
    // This handles both custom domains and localhost
    const domainParts = hostname.split('.');
    let cookieDomain;
    
    // If we have a proper domain with at least 2 parts (not localhost)
    if (domainParts.length >= 2 && !hostname.includes('localhost')) {
      // Get the top two levels of the domain (e.g., example.com)
      const baseDomain = domainParts.slice(-2).join('.');
      // Prefix with a dot to include all subdomains
      cookieDomain = '.' + baseDomain;
      console.log(`Setting cookie domain to: ${cookieDomain} for cross-subdomain logout`);
    }
    
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax', // Changed from 'Strict' to 'Lax' to match login handler
      domain: cookieDomain // Add domain property for subdomain support
    });

    // Send success response
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error.message);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
}