// src/middleware/csrf.js
import Tokens from 'csrf';

// Create a new instance of the CSRF token generator with reasonable defaults
const tokens = new Tokens({
  saltLength: 8, // Lower salt length to avoid issues
  secretLength: 18 // Shorter, but still secure secret
});

// Helper to extract hostname information for logging
function getHostInfo(req) {
  return {
    hostname: req.hostname,
    originalUrl: req.originalUrl,
    method: req.method,
    protocol: req.protocol,
    secure: req.secure,
    sessionID: req.session?.id?.substring(0, 8) || 'no-session-id',
    hasSecret: !!req.session?.csrfSecret
  };
}

// Generate a secret for the user if they don't have one yet
export function generateCsrfSecret(req, res, next) {
  try {
    // Ensure session exists
    if (!req.session) {
      console.error('Session middleware not installed correctly');
      return next(new Error('Session middleware not configured'));
    }

    const hostInfo = getHostInfo(req);
    
    if (!req.session.csrfSecret) {
      req.session.csrfSecret = tokens.secretSync();
      console.log(`[CSRF] Generated new secret for session ${hostInfo.sessionID}`);
    } else {
      console.log(`[CSRF] Using existing secret for session ${hostInfo.sessionID}`);
    }
    
    // Force session save to ensure the secret is stored
    req.session.save(err => {
      if (err) {
        console.error(`[CSRF] Error saving session:`, err);
      }
      next();
    });
  } catch (error) {
    console.error('[CSRF] Error in generateCsrfSecret:', error);
    next(error);
  }
}

// Generate a CSRF token based on the secret
export function generateCsrfToken(req, res, next) {
  try {
    const hostInfo = getHostInfo(req);
    console.log(`[CSRF] Generating token. Session state:`, hostInfo);
    
    if (!req.session.csrfSecret) {
      console.error(`[CSRF] No CSRF secret found in session ${hostInfo.sessionID}`);
      // Generate a secret if one doesn't exist - recovery mechanism
      req.session.csrfSecret = tokens.secretSync();
      console.log(`[CSRF] Recovery: Generated new secret for session ${hostInfo.sessionID}`);
    }

    // Generate a token based on the secret
    req.csrfToken = tokens.create(req.session.csrfSecret);
    console.log(`[CSRF] Generated token for session ${hostInfo.sessionID}`);
    next();
  } catch (error) {
    console.error('[CSRF] Error in generateCsrfToken:', error);
    res.status(500).json({ error: 'Failed to generate CSRF token', details: error.message });
  }
}

// Validate the CSRF token from the request
export function validateCsrfToken(req, res, next) {
  // Skip CSRF validation for non-mutating methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF for specific endpoints (add any paths that need exemption)
  const csrfExemptPaths = [
    '/api/participants/login', // Temporarily exempt login
  ];
  
  if (csrfExemptPaths.some(path => req.path.startsWith(path))) {
    console.log(`[CSRF] Skipping validation for exempt path: ${req.path}`);
    return next();
  }

  try {
    const hostInfo = getHostInfo(req);
    console.log(`[CSRF] Validating token for ${req.method} ${req.path}. Session state:`, hostInfo);
    
    const secret = req.session.csrfSecret;
    // Check multiple places for the token
    const token = 
      req.headers['x-csrf-token'] || 
      (req.body ? req.body._csrf : null) || 
      req.query._csrf;
    
    console.log(`[CSRF] Token present: ${!!token}, Secret present: ${!!secret}`);
    
    if (!secret) {
      console.error(`[CSRF] No CSRF secret in session ${hostInfo.sessionID}`);
      return res.status(403).json({ error: 'CSRF session missing or expired' });
    }

    if (!token) {
      console.error(`[CSRF] No CSRF token provided in request to ${req.path}`);
      return res.status(403).json({ error: 'CSRF token missing' });
    }

    const isValid = tokens.verify(secret, token);
    console.log(`[CSRF] Token validation ${isValid ? 'succeeded' : 'failed'} for ${req.path}`);
    
    if (!isValid) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }

    next();
  } catch (error) {
    console.error('[CSRF] Error in validateCsrfToken:', error);
    res.status(403).json({ error: 'CSRF validation error', details: error.message });
  }
}

// Endpoint to get a new CSRF token
export function csrfTokenHandler(req, res) {
  try {
    const hostInfo = getHostInfo(req);
    
    if (!req.csrfToken) {
      console.error(`[CSRF] No token generated for session ${hostInfo.sessionID}`);
      return res.status(500).json({ error: 'Failed to generate CSRF token' });
    }
    
    console.log(`[CSRF] Sending token for session ${hostInfo.sessionID}`);
    res.json({ csrfToken: req.csrfToken });
  } catch (error) {
    console.error('[CSRF] Error in csrfTokenHandler:', error);
    res.status(500).json({ error: 'CSRF token handler error', details: error.message });
  }
}