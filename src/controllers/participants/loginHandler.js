// src/controllers/participants/loginHandler.js
import { getParticipantByEmail } from '../../db/participants/getParticipantByEmail.js';
import bcryptjs from 'bcryptjs';
import { signToken } from '../../services/authService.js';
import { createParticipantEvent } from '../../db/participantEvents/index.js';
import { getPreferenceWithFallback } from '../../db/preferences/getPreferenceWithFallback.js';
import { determineClientSchema } from '../../utils/clientSchema.js';
import { getDefaultSchema, setDefaultSchema } from '../../config/schema.js';

// System participant ID for logging events not associated with a specific participant
const SYSTEM_PARTICIPANT_ID = 815; // Special participant created for system events

/**
 * Handles participant login requests and sets an HttpOnly cookie
 */
export async function loginHandler(req, res) {
  try {
    console.log('Login request received:', { 
      hostname: req.hostname,
      path: req.path,
      method: req.method,
      headers: req.headers,
      body: { email: req.body.email, password: '***' } // Don't log actual password
    });
    
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Log hostname for debugging
    console.log('Request properties for schema detection:', {
      hostname: req.hostname,
      subdomain: req.hostname.split('.')[0],
      defaultSchema: getDefaultSchema()
    });

    // Use the schema determined by the setClientPool middleware
    // This ensures we use the same schema as the pool that's already attached
    // to the request by the middleware
    if (req.clientPool && req.clientPool.options && req.clientPool.options.schema) {
      console.log(`Using schema from clientPool: ${req.clientPool.options.schema} for login request`);
    } else {
      // Determine schema from hostname directly
      try {
        const { determineSchemaFromHostname } = await import('../../middleware/setClientSchema.js');
        const schema = determineSchemaFromHostname(req.hostname);
        console.log(`Dynamically determined schema: ${schema} for login request`);
      } catch (err) {
        console.error('Error determining schema:', err.message);
      }
    }
    
    console.log(`Looking up email: ${email} for login request`);

    // Use the client-specific pool that was set by the setClientPool middleware
    // This ensures we use the correct schema for database operations
    if (!req.clientPool) {
      // Enhanced error diagnostics
      const errorDetail = {
        hasClientPool: !!req.clientPool,
        middlewareOrder: 'Check app.js',
        hostname: req.hostname,
        subdomain: req.hostname.split('.')[0],
        requestPath: req.path,
        cookieCount: Object.keys(req.cookies || {}).length,
        sessionExists: !!req.session,
        headerKeys: Object.keys(req.headers)
      };
      
      console.error('Database connection error details:', errorDetail);
      console.error('No client pool available. The setClientPool middleware might not be applied.');
      return res.status(500).json({ 
        error: 'Database connection error', 
        detail: 'Application configuration issue - contact support.'
      });
    }

    let participant = null;
    
    try {
      // Query the database directly using the client-specific pool
      const query = `
        SELECT * FROM participants
        WHERE email = $1
      `;
      const values = [email];
      
      const result = await req.clientPool.query(query, values);
      participant = result.rows[0] || null;
    } catch (dbError) {
      console.error(`Database error when looking up participant by email: ${dbError.message}`);
      return res.status(500).json({ error: 'Database error when looking up participant' });
    }
    if (!participant) {
    // Log unsuccessful login attempt (participant not found - type 3)
    // Using system participant ID since the database requires a valid participant_id
    // Don't log the password for security reasons
    await createParticipantEvent(SYSTEM_PARTICIPANT_ID, 3, { email }, req.clientPool);
      return res.status(401).json({ error: 'Login failed.' });
    }

    const isPasswordValid = await bcryptjs.compare(password, participant.password);
    if (!isPasswordValid) {
      // Log unsuccessful login attempt (invalid password - type 2)
      // Don't log the password for security reasons
      await createParticipantEvent(participant.id, 2, { email }, req.clientPool);
      return res.status(401).json({ error: 'Login failed.' });
    }

    // Log successful login (type 1)
    await createParticipantEvent(participant.id, 1, { email }, req.clientPool);

    const { password: _, ...participantData } = participant;
    
  // Get the participant's avatar ID from preferences
  try {
    const avatarIdPreference = await getPreferenceWithFallback('avatar_id', participant.id, req.clientPool);
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

    // Check if we're on localhost for schema and cookie settings
    const isLocalhost = req.hostname.includes('localhost');
    console.log(`Determining client schema for participant ${participant.id}, isLocalhost: ${isLocalhost}`);
    
    const participantSchema = determineClientSchema(participant, { isLocalhost });
    console.log(`Using schema ${participantSchema} for JWT token`);
    
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
    
    // Determine if we should use secure cookies based on environment and protocol
    const isProduction = process.env.NODE_ENV === 'production';
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    
    // Skip secure cookies for localhost unless explicitly enabled
    const skipSecureForLocalhost = process.env.SKIP_SSL_FOR_LOCALHOST !== 'false';
    const useSecureCookies = (isProduction || isHttps || process.env.USE_HTTPS === 'true') && 
                            !(isLocalhost && skipSecureForLocalhost);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: useSecureCookies, // Use secure cookies when HTTPS is available and not on localhost
      sameSite: useSecureCookies ? 'Strict' : 'Lax', // Stricter when using HTTPS
      domain: cookieDomain, // Add domain property for subdomain support
      maxAge: 24 * 60 * 60 * 1000 // 24 hours (increased from 1 hour to reduce frequency of session timeouts)
    });
    
    if (useSecureCookies) {
      console.log('Using secure cookies with strict same-site policy');
    } else {
      if (isLocalhost) {
        console.log('Using non-secure cookies for localhost development');
      } else {
        console.log('Using non-secure cookies with lax same-site policy (development mode)');
      }
    }

    // Initialize the LLM service with the participant's preferences
    try {
      const { initLLMService } = await import('../../services/llmService.js');
      // Determine schema from hostname for LLM service
      const schema = determineClientSchema(participant, { isLocalhost });
      await initLLMService(participant.id, { schema, pool: req.clientPool });
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
