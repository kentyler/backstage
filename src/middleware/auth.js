// src/middleware/auth.js
import jwt from 'jsonwebtoken';

// Enhanced JWT authentication debugging
const AUTH_DEBUG = process.env.NODE_ENV !== 'production' || process.env.DEBUG_AUTH === 'true';

// Pull in the secret used to sign tokens
const JWT_SECRET = process.env.JWT_SECRET;

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
 * Enhanced Express middleware that supports dual authentication:
 * 1. Reads a JWT from Authorization header OR HttpOnly cookie
 * 2. Verifies the JWT from either source
 * 3. Attaches the decoded payload to req.user
 * 4. Returns 401 if missing or invalid from both sources
 * 
 * This approach provides more resilience across different environments
 * where cookie handling might vary (localhost vs production servers)
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

  // 2. If no token from any source, reject
  if (!token) {
    logAuthError('Authentication failed: No token found', { cookies: !!req.cookies, headers: req.headers });
    return res.status(401).json({ 
      error: 'Missing auth token', 
      details: 'No authentication token found in request cookies or Authorization header',
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
