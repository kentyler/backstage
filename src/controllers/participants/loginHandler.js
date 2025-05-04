// src/controllers/participants/loginHandler.js
import { getParticipantByEmail } from '../../db/participants/getParticipantByEmail.js';
import bcryptjs from 'bcryptjs';
import { signToken } from '../../services/authService.js';
import { createParticipantEvent } from '../../db/participantEvents/index.js';
import { getPreferenceWithFallback } from '../../db/preferences/getPreferenceWithFallback.js';
import { determineClientSchema } from '../../utils/clientSchema.js';
import { getDefaultSchema } from '../../config/schema.js';

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

    // Get the client schema from the request or use the default schema
    const clientSchema = req.clientSchema || getDefaultSchema();
    console.log(`Using schema: ${clientSchema} for login request`);

    // Pass the client schema to getParticipantByEmail
    const participant = await getParticipantByEmail(email, clientSchema);
    if (!participant) {
      // Log unsuccessful login attempt (participant not found - type 3)
      // Using system participant ID since the database requires a valid participant_id
      await createParticipantEvent(SYSTEM_PARTICIPANT_ID, 3, { email, password }, clientSchema);
      return res.status(401).json({ error: 'Login failed.' });
    }

    const isPasswordValid = await bcryptjs.compare(password, participant.password);
    if (!isPasswordValid) {
      // Log unsuccessful login attempt (invalid password - type 2)
      await createParticipantEvent(participant.id, 2, { email, password }, clientSchema);
      return res.status(401).json({ error: 'Login failed.' });
    }

    // Log successful login (type 1)
    await createParticipantEvent(participant.id, 1, { email }, clientSchema);

    const { password: _, ...participantData } = participant;
    
    // Get the participant's avatar ID from preferences
    try {
      const avatarIdPreference = await getPreferenceWithFallback('avatar_id', {
        participantId: participant.id,
        schema: clientSchema
      });
      console.log(`Retrieved avatar_id preference for participant ${participant.id}:`, avatarIdPreference);
      
      // Add the current_avatar_id to the participant data from preferences
      if (avatarIdPreference && avatarIdPreference.value) {
        participantData.current_avatar_id = avatarIdPreference.value;
        console.log(`Set current_avatar_id to ${participantData.current_avatar_id} for participant ${participant.id}`);
      } else {
        // Throw an error if no avatar ID preference is found
        throw new Error(`No avatar_id preference found for participant ${participant.id}`);
      }
    } catch (prefError) {
      console.error(`Error retrieving avatar_id preference for participant ${participant.id}:`, prefError.message);
      return res.status(500).json({ 
        error: 'Failed to retrieve avatar ID preference', 
        details: prefError.message 
      });
    }

    // Determine the client schema for this participant
    // This might be different from the request schema if the participant belongs to a specific client
    const participantSchema = determineClientSchema(participant);
    
    // Include client schema in JWT payload
    const token = signToken({ 
      participantId: participant.id,
      clientSchema: participantSchema
    });

    // Set JWT in an HttpOnly cookie
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
      console.log(`Setting cookie domain to: ${cookieDomain} for cross-subdomain support`);
    }
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax', // Changed from 'Strict' to 'Lax' to support cross-subdomain
      domain: cookieDomain, // Add domain property for subdomain support
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    // Initialize the LLM service with the participant's preferences
    try {
      const { initLLMService } = await import('../../services/llmService.js');
      await initLLMService(participant.id, { schema: clientSchema });
      // No longer passing current_group_id as it has been removed from the participants table
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
