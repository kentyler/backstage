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
