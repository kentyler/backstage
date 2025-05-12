// src/controllers/participants/loginHandler.js
import { getParticipantByEmail } from '../../db/participants/getParticipantByEmail.js';
import bcryptjs from 'bcryptjs';
import { signToken } from '../../services/authService.js';
import { createParticipantEvent } from '../../db/participantEvents/index.js';
// Removed getPreferenceWithFallback import - no longer needed in login process
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
      // Query the participants table from the public schema
      // This table has been moved to public schema to be accessible across all environments
      const query = `
        SELECT * FROM public.participants
        WHERE email = $1
      `;
      const values = [email];
      
      console.log(`Looking up participant with email ${email} in public.participants table`);
      const result = await req.clientPool.query(query, values);
      participant = result.rows[0] || null;
      
      if (participant) {
        console.log(`Found participant with ID: ${participant.id} in public schema`);
      } else {
        console.log('No participant found with that email in public schema');
      }
    } catch (dbError) {
      console.error(`Database error when looking up participant by email: ${dbError.message}`);
      return res.status(500).json({ error: 'Database error when looking up participant' });
    }
    if (!participant) {
    // Log unsuccessful login attempt (participant not found - type 3)
    // Using system participant ID since the database requires a valid participant_id
    // Don't log the password for security reasons
    try {
      await createParticipantEvent(SYSTEM_PARTICIPANT_ID, 3, { email }, req.clientPool);
      console.log(`Logged unsuccessful login attempt (no participant found) for email: ${email}`);
    } catch (eventError) {
      console.error(`Failed to log login event: ${eventError.message}`);
      // Continue with login failure response even if logging fails
    }
    return res.status(401).json({ error: 'Login failed.' });
    }

    const isPasswordValid = await bcryptjs.compare(password, participant.password);
    if (!isPasswordValid) {
      // Log unsuccessful login attempt (invalid password - type 2)
      // Don't log the password for security reasons
      try {
        await createParticipantEvent(participant.id, 2, { email }, req.clientPool);
        console.log(`Logged unsuccessful login attempt (invalid password) for participant ID: ${participant.id}`);
      } catch (eventError) {
        console.error(`Failed to log invalid password event: ${eventError.message}`);
        // Continue with login failure response even if logging fails
      }
      return res.status(401).json({ error: 'Login failed.' });
    }

    // Log successful login (type 1)
    try {
      await createParticipantEvent(participant.id, 1, { email }, req.clientPool);
      console.log(`Logged successful login for participant ID: ${participant.id}`);
    } catch (eventError) {
      console.error(`Failed to log successful login event: ${eventError.message}`);
      // Continue with login process even if logging fails
    }

    const { password: _, ...participantData } = participant;
    
  // Clean separation of concerns - no preference or avatar handling during login
  // All schema-specific data will be loaded when the user hits the index page with proper schema context
  console.log(`Authenticated participant ID: ${participant.id} - preferences will be loaded in index.html`);
  
  // Note: We're completely removing preference lookups from the login process
  // This provides a cleaner separation between:
  // 1. Authentication (using public.participants)
  // 2. Personalization (using schema-specific tables like preferences)

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
    
    // Also include the token in the response for the dual authentication approach
    // This allows clients to store the token in localStorage as a fallback
    // when cookies don't work properly in certain environments
    const responseWithToken = {
      participant: participantData,
      token: token, // Include token in response body
      message: 'Login successful',
      supportsDualAuth: true
    };
    
    // Determine if we should use secure cookies based on environment and protocol
    const isProduction = process.env.NODE_ENV === 'production';
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    
    // Skip secure cookies for localhost unless explicitly enabled
    const skipSecureForLocalhost = process.env.SKIP_SSL_FOR_LOCALHOST !== 'false';
    const useSecureCookies = (isProduction || isHttps || process.env.USE_HTTPS === 'true') && 
                            !(isLocalhost && skipSecureForLocalhost);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: isHttps || isLocalhost === false,
      sameSite: (isHttps || isLocalhost === false) ? 'none' : 'lax',
      domain: cookieDomain,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/' // Available across all paths
    });
    
    // Check if cookie was set (for debugging)
    const cookiesSet = res.getHeader('Set-Cookie');
    console.log(`Set-Cookie header: ${cookiesSet}`);
    
    // Initialize the LLM service with the participant's preferences before responding
    try {
      const { initLLMService } = await import('../../services/llmService.js');
      // Determine schema from hostname for LLM service
      const schema = determineClientSchema(participant, { isLocalhost });
      await initLLMService(participant.id, { schema, pool: req.clientPool });
      console.log(`Successfully initialized LLM service for participant ${participant.id}`);
    } catch (llmError) {
      console.warn(`Failed to initialize LLM service for participant ${participant.id}: ${llmError.message}`);
      // Continue with login even if LLM initialization fails
    }
    
    console.log('Sending response with dual authentication support');
    // Return the participant data and token for dual authentication
    return res.status(200).json(responseWithToken);
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
}
