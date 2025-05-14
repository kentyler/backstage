// src/middleware/auth.js
// Simplified dual authentication middleware based on previous implementation
import jwt from 'jsonwebtoken';

// Debug mode for detailed logging
const AUTH_DEBUG = process.env.NODE_ENV !== 'production' || process.env.DEBUG_AUTH === 'true';

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET;

// Simplified logging functions
function debug(...args) {
  if (AUTH_DEBUG) {
    console.log('[Auth]', ...args);
  }
}

function logAuthError(message, details = {}) {
  console.error(`[Auth ERROR] ${message}`, details);
}

/**
 * Simplified dual authentication middleware that maintains the core
 * principles of the original implementation:
 * 
 * 1. Primary: Uses HTTP-only cookies (more secure)
 * 2. Fallback: Checks Authorization headers with Bearer tokens
 * 3. Clear logging for debugging authentication issues
 * 
 * This simplified approach maintains compatibility with your existing
 * dual authentication system while removing unnecessary complexity.
 */
export function requireAuth(req, res, next) {
  debug(`Authenticating request to ${req.path}`);
  
  // Check for JWT secret before proceeding
  if (!JWT_SECRET) {
    logAuthError('JWT_SECRET environment variable is missing or empty');
    return res.status(500).json({ 
      error: 'Server configuration error', 
      details: 'JWT_SECRET environment variable is missing' 
    });
  }
  
  // 1. Extract token from multiple possible sources
  let token = null;
  let tokenSource = 'none';
  
  // Cookie-first approach (primary authentication method)
  if (req.cookies && req.cookies.token) {
    debug('Found token in cookies');
    token = req.cookies.token;
    tokenSource = 'cookie';
  } 
  // Fallback to Authorization header (for clients using localStorage)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    debug('Found token in Authorization header');
    token = req.headers.authorization.split(' ')[1];
    tokenSource = 'header';
  }
  
  // No token found - send unauthorized response
  if (!token) {
    debug('No authentication token found');
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication required',
      details: 'No valid authentication token provided'
    });
  }
  
  // 2. Verify the token
  try {
    // Attempt to verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    debug(`Token verified successfully (source: ${tokenSource})`);
    
    // Check for required claims
    if (!decoded.participantId) {
      logAuthError('Token missing required participantId claim');
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Token is missing required claims'
      });
    }
    
    // Set user data on request object
    req.user = {
      ...decoded,
      authMethod: tokenSource
    };
    
    // Log success for diagnostics
    debug(`Authentication successful for participant ${decoded.participantId}`);
    
    // Continue to protected route
    return next();
  } 
  catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      logAuthError('Token expired', { 
        expiredAt: error.expiredAt,
        source: tokenSource
      });
      
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your authentication token has expired',
        details: 'Please log in again to continue'
      });
    } 
    else if (error.name === 'JsonWebTokenError') {
      logAuthError('Invalid token', {
        message: error.message,
        source: tokenSource
      });
      
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Authentication failed',
        details: 'Your authentication token is invalid'
      });
    }
    
    // Generic error handling
    logAuthError('Error verifying token', {
      error: error.message,
      name: error.name,
      source: tokenSource
    });
    
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Unable to verify your authentication token',
      details: error.message
    });
  }
}

// Default export for easier importing
export default requireAuth;
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
