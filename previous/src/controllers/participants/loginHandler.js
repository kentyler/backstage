// src/controllers/participants/loginHandler.js
import { getParticipantByEmail } from '../../db/participants/getParticipantByEmail.js';
import bcryptjs from 'bcryptjs';
import { signToken } from '../../services/authService.js';
import { createParticipantEvent } from '../../db/participantEvents/index.js';
import jwt from 'jsonwebtoken';
// Removed getPreferenceWithFallback import - no longer needed in login process
import { determineClientSchema } from '../../utils/clientSchema.js';
import { getDefaultSchema, setDefaultSchema } from '../../config/schema.js';

// System participant ID for logging events not associated with a specific participant
const SYSTEM_PARTICIPANT_ID = 815; // Special participant created for system events

/**
 * Handles participant login requests and sets an HttpOnly cookie
 */
export async function loginHandler(req, res) {
  // Global try-catch with enhanced error diagnostics
  try {
    // Start with a clear separation marker in logs to easily identify login attempts
    console.log('=============================================================');
    console.log(`LOGIN ATTEMPT: ${new Date().toISOString()}`);
    console.log('=============================================================');
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
      console.log(`Database pool details:`, {
        exists: !!req.clientPool,
        schema: req.clientPool?.options?.schema || 'unknown',
        poolObj: typeof req.clientPool,
        hasQueryMethod: typeof req.clientPool?.query === 'function'
      });
      
      // Check if client pool has a valid query method before proceeding
      if (!req.clientPool || typeof req.clientPool.query !== 'function') {
        console.error('Critical error: clientPool missing or invalid query method');
        return res.status(500).json({ 
          error: 'Database configuration error', 
          detail: 'Invalid database connection. Emergency: contact system administrator.'
        });
      }
      
      // Verify global pool exists as fallback (just for diagnostics)
      if (!global.pool) {
        console.warn('Warning: global.pool is not available as fallback');
      } else {
        console.log('global.pool is available as fallback if needed');
      }
      
      // Query the participants table from the public schema with robust error handling
      console.log(`Preparing to query public.participants table for email: ${email}`);
      
      const query = `
        SELECT * FROM public.participants
        WHERE email = $1
      `;
      const values = [email];
      
      let result;
      try {
        // First try with client pool
        console.log(`Executing query with clientPool`);
        result = await req.clientPool.query(query, values);
        console.log(`Query executed successfully with ${result.rowCount} results`);
      } catch (primaryDbError) {
        console.error(`Primary DB query failed: ${primaryDbError.message}`);
        console.error(`Error details:`, primaryDbError);
        
        // Try with fallback global pool if available
        if (global.pool && typeof global.pool.query === 'function') {
          try {
            console.log(`Attempting fallback with global pool`);
            result = await global.pool.query(query, values);
            console.log(`Fallback query succeeded with ${result.rowCount} results`); 
          } catch (fallbackError) {
            console.error(`Fallback query also failed: ${fallbackError.message}`);
            throw new Error(
              `Database connection completely failed. Primary error: ${primaryDbError.message}, ` +
              `Fallback error: ${fallbackError.message}`
            );
          }
        } else {
          // No fallback available
          throw primaryDbError;
        }
      }
      
      participant = result.rows[0] || null;
      
      if (participant) {
        console.log(`Found participant with ID: ${participant.id} in public schema`);
      } else {
        console.log('No participant found with that email in public schema');
      }
    } catch (dbError) {
      console.error(`CRITICAL DATABASE ERROR: ${dbError.message}`);
      console.error(`Stack trace: ${dbError.stack}`);
      console.error('Database connection environment:', {
        NODE_ENV: process.env.NODE_ENV,
        DB_HOST: process.env.DB_HOST ? 'Set (value hidden)' : 'Not set',
        DB_PORT: process.env.DB_PORT || 'Not set',
        DB_NAME: process.env.DB_NAME ? 'Set (value hidden)' : 'Not set',
        DB_USER: process.env.DB_USER ? 'Set (value hidden)' : 'Not set',
        DB_PASSWORD: process.env.DB_PASSWORD ? 'Set (exists)' : 'Not set'
      });
      return res.status(500).json({ 
        error: 'Database error occurred', 
        detail: 'Our system is experiencing technical difficulties. Please try again later.' 
      });
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
    
    // Get JWT secret directly from environment for consistency with auth middleware
    const JWT_SECRET = process.env.JWT_SECRET;
    
    // Check if JWT_SECRET is available
    if (!JWT_SECRET) {
      console.error('ERROR: JWT_SECRET environment variable is missing or empty');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    // Enhanced debug for token creation with fallback mechanisms
    console.log(`Creating JWT token for participant ${participant.id} with schema ${participantSchema}`);
    
    let token;
    let tokenCreationMethod = 'standard';
    
    // Try primary token creation approach
    try {
      console.log('Attempting to create token with signToken function');
      token = signToken({ 
        participantId: participant.id,
        clientSchema: participantSchema
      });
      console.log('Token creation with signToken succeeded');
    } catch (signError) {
      // Log the error but try direct JWT signing as fallback
      console.error('Error using signToken function:', signError.message);
      console.error('Attempting direct JWT signing as fallback');
      
      try {
        tokenCreationMethod = 'direct';
        token = jwt.sign(
          { 
            participantId: participant.id,
            clientSchema: participantSchema
          }, 
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        console.log('Direct token creation succeeded');
      } catch (directSignError) {
        console.error('CRITICAL: Both token creation methods failed');
        console.error('Primary error:', signError.message);
        console.error('Direct sign error:', directSignError.message);
        return res.status(500).json({ 
          error: 'Authentication service error', 
          detail: 'Unable to generate secure token. Please try again.'
        });
      }
    }
    
    // Verify the token content to ensure JWT_SECRET is working
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log(`Token verification successful (created via ${tokenCreationMethod}). Payload contains:`, 
        JSON.stringify({
          participantId: decoded.participantId,
          clientSchema: decoded.clientSchema,
          // Log exp as human-readable date
          expiresAt: new Date(decoded.exp * 1000).toISOString(),
          tokenLength: token.length
        }));
    } catch (e) {
      // Critical verification error - this indicates environment problems
      console.error('CRITICAL: Token verification failed immediately after creation:', e.message);
      console.error('This suggests JWT_SECRET may be inconsistent across the application');
      console.error('JWT environment:', {
        JWT_SECRET_LENGTH: JWT_SECRET ? JWT_SECRET.length : 0,
        NODE_ENV: process.env.NODE_ENV,
        TOKEN_LENGTH: token ? token.length : 0
      });
      
      // Don't fail - this might still work if client-side verification uses same secret
      console.warn('Proceeding despite verification issue - client may still be able to use token');
    }

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
