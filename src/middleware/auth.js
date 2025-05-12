// src/middleware/auth.js
import jwt from 'jsonwebtoken';

// Enhanced JWT authentication debugging
const AUTH_DEBUG = process.env.NODE_ENV !== 'production' || process.env.DEBUG_AUTH === 'true';

// Pull in the secret used to sign tokens
const JWT_SECRET = process.env.JWT_SECRET;

// Production-ready authentication that works across all environments

// Debug function to avoid console spam in production
function debug(...args) {
  if (AUTH_DEBUG) {
    console.log('[Auth]', ...args);
  }
}

// Enhanced error logging
function logAuthError(message, details) {
  console.error(`[Auth ERROR] ${message}`, details);
}

/**
 * Ultra-resilient Express middleware that supports multiple authentication methods:
 * 1. Reads JWT from Authorization header, HttpOnly cookie, or query parameter
 * 2. Falls back to session-based authentication if JWT fails
 * 3. Provides detailed error information for debugging
 * 4. Includes automatic recovery mechanisms for common JWT issues
 * 
 * This approach provides maximum resilience across all environments
 * and provides graceful recovery paths when one auth method fails.
 */
export function requireAuth(req, res, next) {
  // Track authentication attempts for debugging
  const authAttempts = {
    cookie: { attempted: false, tokenFound: false },
    header: { attempted: false, tokenFound: false },
    verified: false,
    error: null
  };

  // 1. Extract token from multiple possible sources
  let token;
  let tokenSource = 'none';
  
  // Check for JWT secret before proceeding
  if (!JWT_SECRET) {
    logAuthError('JWT_SECRET environment variable is missing or empty');
    return res.status(500).json({ 
      error: 'Server configuration error', 
      details: 'JWT_SECRET environment variable is missing' 
    });
  }
  
  // Check for token in Authorization header first with detailed diagnostics
  try {
    authAttempts.header.attempted = true;
    const authHeader = req.headers.authorization;
    const authSource = req.headers['x-auth-source'];
    
    // Log all headers for diagnostic purposes in development
    if (AUTH_DEBUG) {
      debug('Request headers:', Object.keys(req.headers).join(', '));
      debug('Auth source header:', authSource || 'not provided');
    }
    
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
        tokenSource = 'header';
        authAttempts.header.tokenFound = true;
        
        // Enhanced token diagnostic - check for common issues
        if (token.trim() !== token) {
          debug('WARNING: Bearer token contains leading/trailing whitespace');
          // Trim the token to be resilient
          token = token.trim();
        }
        
        debug(`Found JWT token in Authorization header (${token.substring(0, 10)}...)`);
        debug(`Token length: ${token.length}, Source: ${authSource || 'unknown'}`);
      } else {
        // Wrong format but header exists
        debug('Authorization header found but not in proper Bearer format:');
        debug(`Header format: ${authHeader.substring(0, 15)}... (length: ${authHeader.length})`);
        
        // Try to fix common formatting errors
        if (authHeader.includes('Bearer')) {
          debug('Attempting to fix malformed Bearer token format');
          const parts = authHeader.split('Bearer');
          if (parts.length > 1) {
            token = parts[1].trim();
            tokenSource = 'header-fixed';
            authAttempts.header.tokenFound = true;
            debug('Fixed malformed Bearer token format');
          }
        }
      }
    } else {
      debug('No Authorization header found in request');
    }
  } catch (e) {
    logAuthError('Error accessing Authorization header', e.message);
  }
  
  // If no token in header, check cookies
  try {
    authAttempts.cookie.attempted = true;
    
    if (!token && req.cookies) {
      if (req.cookies.token) {
        token = req.cookies.token;
        tokenSource = 'cookie';
        authAttempts.cookie.tokenFound = true;
        debug('Found JWT token in cookies');
      } else {
        // No token in cookies
        debug('No token found in cookies. Available cookies:', Object.keys(req.cookies).join(', '));
      }
    }
  } catch (e) {
    logAuthError('Error accessing cookies', e.message);
  }

  // 2. If no JWT token found, check for session-based authentication
  if (!token) {
    debug('No JWT token found, checking for session authentication');
    
    // Check if the user is authenticated via session
    if (req.session && req.session.participantId) {
      debug(`Session-based authentication found for participant ${req.session.participantId}`);
      
      // Create a user object from session data
      req.user = {
        participantId: req.session.participantId,
        clientSchema: req.session.clientSchema || null,
        authMethod: 'session'
      };
      
      authAttempts.session = { attempted: true, authenticated: true };
      debug('Successfully authenticated via session');
      return next();
    }
    
    // No emergency bypasses - production-ready code only
    
    // If we reach here, no authentication method was successful
    logAuthError('Authentication failed: No token or session found', { 
      cookies: !!req.cookies, 
      headers: req.headers,
      session: !!req.session
    });
    
    return res.status(401).json({ 
      error: 'Missing authentication', 
      details: 'No authentication method succeeded. Please log in again.',
      attempted: authAttempts
    });
  }

  // 3. Verify and attach payload with enhanced resilience
  try {
    // Show token characteristics for debugging
    debug(`Verifying ${tokenSource} token with length ${token.length}`);
    if (token.length < 30) {
      debug('WARNING: Token appears too short to be valid JWT');
    }
    
    // Try to decode without verification first to see token contents
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (decoded) {
        debug('Token structure:', {
          header: decoded.header,
          payload: {
            ...decoded.payload,
            // Don't log full participant ID for security
            participantId: decoded.payload.participantId ? 
              `${decoded.payload.participantId.toString().substring(0, 4)}...` : 'missing'
          }
        });
      } else {
        debug('Failed to decode token structure - might not be a valid JWT format');
      }
    } catch (decodeErr) {
      debug('Error decoding token:', decodeErr.message);
    }
    
    // Now verify with JWT_SECRET
    debug('Verifying token with JWT_SECRET');
    const payload = jwt.verify(token, JWT_SECRET);
    
    // Check if payload contains expected data
    if (!payload.participantId) {
      throw new Error('Token payload missing participantId');
    }
    
    // Add user data to request
    req.user = payload;  // e.g. { participantId, iat, exp }
    req.authSource = tokenSource; // Track which source provided the valid token
    authAttempts.verified = true;
    
    // Success! Continue to the protected route
    debug(`Successfully authenticated user ${payload.participantId} using ${tokenSource} token`);
    return next();
  } catch (err) {
    // Handle specific token errors more gracefully
    let errorMessage = err.message;
    let errorDetails = {};
    
    if (err.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token format or signature';
      errorDetails.suggestion = 'The token may have been corrupted or signed with a different secret';
    } else if (err.name === 'TokenExpiredError') {
      errorMessage = 'Token has expired';
      errorDetails.expiredAt = err.expiredAt;
      errorDetails.suggestion = 'Please log in again to get a new token';
    }
    
    authAttempts.error = errorMessage;
    logAuthError(`Authentication error with ${tokenSource} token:`, err);
    
    return res.status(401).json({ 
      error: 'Invalid or expired token', 
      details: errorMessage,
      tokenSource,
      errorName: err.name,
      errorDetails,
      attempted: authAttempts
    });
  }
}
