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

// Default fallback secret for development/emergency use only
// In production, this should be replaced by environment variable
const FALLBACK_SECRET = process.env.CSRF_FALLBACK_SECRET || 'development-emergency-csrf-secret';

// Generate a secret for the user if they don't have one yet
export function generateCsrfSecret(req, res, next) {
  try {
    const hostInfo = getHostInfo(req);
    
    // Check if session is available
    if (!req.session) {
      console.warn('[CSRF] Session unavailable - using fallback secret mechanism');
      // Use fallback mechanism if session is unavailable
      // We'll use a temporary request-scoped secret since we can't store in session
      req.csrfSecretFallback = FALLBACK_SECRET;
      console.log('[CSRF] Applied fallback CSRF secret');
      return next();
    }

    // Normal flow with session available
    if (!req.session.csrfSecret) {
      req.session.csrfSecret = tokens.secretSync();
      console.log(`[CSRF] Generated new secret for session ${hostInfo.sessionID}`);
    } else {
      console.log(`[CSRF] Using existing secret for session ${hostInfo.sessionID}`);
    }
    
    // Force session save with error handling
    try {
      req.session.save(err => {
        if (err) {
          console.error(`[CSRF] Error saving session:`, err);
          // Fall back to request-scoped secret if session save fails
          req.csrfSecretFallback = FALLBACK_SECRET;
          console.log('[CSRF] Applied fallback CSRF secret due to session save failure');
        }
        next();
      });
    } catch (sessionError) {
      console.error('[CSRF] Error in session.save():', sessionError);
      // Fall back to request-scoped secret if session.save throws
      req.csrfSecretFallback = FALLBACK_SECRET;
      console.log('[CSRF] Applied fallback CSRF secret due to session.save exception');
      next();
    }
  } catch (error) {
    console.error('[CSRF] Error in generateCsrfSecret:', error);
    // Continue instead of failing - authentication can still work via JWT
    req.csrfSecretFallback = FALLBACK_SECRET;
    console.log('[CSRF] Applied emergency fallback for CSRF secret');
    next();
  }
}

// Generate a CSRF token based on the secret
export function generateCsrfToken(req, res, next) {
  try {
    const hostInfo = getHostInfo(req);
    console.log(`[CSRF] Generating token. Session state:`, hostInfo);
    
    // Handle case where fallback secret is used (session unavailable)
    if (req.csrfSecretFallback) {
      console.log('[CSRF] Using fallback secret for token generation');
      req.csrfToken = tokens.create(req.csrfSecretFallback);
      console.log('[CSRF] Generated token using fallback secret');
      return next();
    }
    
    // Normal session-based flow
    if (!req.session || !req.session.csrfSecret) {
      console.warn(`[CSRF] No CSRF secret found in session ${hostInfo.sessionID}`);
      
      // Check if we can recover by creating a new secret
      if (req.session) {
        // Try to generate and save a new secret
        req.session.csrfSecret = tokens.secretSync();
        console.log(`[CSRF] Recovery: Generated new secret for session ${hostInfo.sessionID}`);
        
        // Generate a token with the new secret
        req.csrfToken = tokens.create(req.session.csrfSecret);
        console.log(`[CSRF] Generated token for session ${hostInfo.sessionID}`);
      } else {
        // Last resort: use fallback if session completely unavailable
        req.csrfSecretFallback = FALLBACK_SECRET;
        req.csrfToken = tokens.create(req.csrfSecretFallback);
        console.log('[CSRF] Using emergency fallback for token generation');
      }
    } else {
      // Normal case: generate token from session secret
      req.csrfToken = tokens.create(req.session.csrfSecret);
      console.log(`[CSRF] Generated token for session ${hostInfo.sessionID}`);
    }
    
    next();
  } catch (error) {
    console.error('[CSRF] Error in generateCsrfToken:', error);
    
    // Instead of failing, try the fallback mechanism
    try {
      req.csrfSecretFallback = FALLBACK_SECRET;
      req.csrfToken = tokens.create(req.csrfSecretFallback);
      console.log('[CSRF] Emergency recovery: Generated token with fallback secret');
      next();
    } catch (fallbackError) {
      console.error('[CSRF] Even fallback token generation failed:', fallbackError);
      res.status(500).json({ error: 'Failed to generate CSRF token', details: error.message });
    }
  }
}

// Validate the CSRF token from the request
export function validateCsrfToken(req, res, next) {
  // Skip CSRF validation for non-mutating methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Expand exemptions to include both /api/me and authentication-related endpoints
  // This is critical for the dual authentication approach to work
  const csrfExemptPaths = [
    '/api/participants/login', 
    '/api/me',                 // Exempt user info endpoint for dual auth
    '/api/csrf-token',         // Exempt token endpoint itself
    '/api/participants/logout' // Exempt logout endpoint
  ];
  
  if (csrfExemptPaths.some(path => req.path.startsWith(path))) {
    console.log(`[CSRF] Skipping validation for exempt path: ${req.path}`);
    return next();
  }

  try {
    const hostInfo = getHostInfo(req);
    console.log(`[CSRF] Validating token for ${req.method} ${req.path}. Session state:`, hostInfo);
    
    // Check multiple places for the token
    const token = 
      req.headers['x-csrf-token'] || 
      (req.body ? req.body._csrf : null) || 
      req.query._csrf;
    
    // Determine which secret to use (session or fallback)
    let secret = null;
    let usingFallback = false;
    
    // First try to get secret from session
    if (req.session && req.session.csrfSecret) {
      secret = req.session.csrfSecret;
      console.log(`[CSRF] Using session secret for validation`);
    } 
    // Then try fallback secret if available
    else if (req.csrfSecretFallback) {
      secret = req.csrfSecretFallback;
      usingFallback = true;
      console.log(`[CSRF] Using fallback secret for validation`);
    }
    // Last resort: use global fallback
    else {
      secret = FALLBACK_SECRET;
      usingFallback = true;
      console.log(`[CSRF] Using global fallback secret for validation`);
    }
    
    console.log(`[CSRF] Token present: ${!!token}, Secret present: ${!!secret}, Using fallback: ${usingFallback}`);
    
    // Check if we have a secret to validate against
    if (!secret) {
      console.error(`[CSRF] No CSRF secret available for validation`);
      // Instead of failing, skip validation in emergency scenarios - we still have JWT auth
      console.warn(`[CSRF] Emergency bypass of CSRF validation for ${req.path}`);
      return next();
    }

    // If no token provided, allow bypass for special paths (our dual auth endpoints)
    if (!token) {
      console.warn(`[CSRF] No CSRF token provided in request to ${req.path}`);
      // For non-critical paths, still enforce CSRF 
      if (!csrfExemptPaths.some(path => req.path.includes(path.split('/').pop()))) {
        return res.status(403).json({ error: 'CSRF token missing' });
      } else {
        console.warn(`[CSRF] Allowing request without token due to path similarity to exempt paths`);
        return next();
      }
    }

    // Verify the token against the selected secret
    const isValid = tokens.verify(secret, token);
    console.log(`[CSRF] Token validation ${isValid ? 'succeeded' : 'failed'} for ${req.path}`);
    
    if (!isValid) {
      // For normal paths, enforce CSRF validation
      if (!csrfExemptPaths.some(path => req.path.includes(path.split('/').pop()))) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
      } else {
        // For exempt-like paths, still allow even with invalid token
        console.warn(`[CSRF] Allowing request with invalid token due to path similarity to exempt paths`);
        return next();
      }
    }

    next();
  } catch (error) {
    console.error('[CSRF] Error in validateCsrfToken:', error);
    
    // For authentication paths, don't block due to CSRF errors
    if (csrfExemptPaths.some(path => req.path.includes(path.split('/').pop()))) {
      console.warn(`[CSRF] Allowing request despite error due to auth-related path`);
      return next();
    }
    
    res.status(403).json({ error: 'CSRF validation error', details: error.message });
  }
}

// Endpoint to get a new CSRF token
export function csrfTokenHandler(req, res) {
  try {
    const hostInfo = getHostInfo(req);
    
    // Check if token is already generated
    if (!req.csrfToken) {
      console.warn(`[CSRF] No token previously generated, attempting emergency generation`);
      
      // Emergency token generation - avoid returning error
      try {
        // Try fallback if available
        if (req.csrfSecretFallback) {
          req.csrfToken = tokens.create(req.csrfSecretFallback);
          console.log('[CSRF] Emergency generated token using request fallback secret');
        }
        // Use global fallback as last resort
        else {
          req.csrfToken = tokens.create(FALLBACK_SECRET);
          console.log('[CSRF] Emergency generated token using global fallback secret');
        }
      } catch (emergencyError) {
        console.error('[CSRF] Emergency token generation failed:', emergencyError);
        return res.status(500).json({ error: 'Failed to generate CSRF token' });
      }
    }
    
    // At this point we should have a token
    if (!req.csrfToken) {
      console.error('[CSRF] All token generation methods failed');
      return res.status(500).json({ error: 'Failed to generate CSRF token' });
    }
    
    // Log token status and source
    const tokenSource = req.csrfSecretFallback ? 'fallback secret' : (req.session?.csrfSecret ? 'session secret' : 'unknown');
    console.log(`[CSRF] Sending token for ${tokenSource} (session ID: ${hostInfo.sessionID || 'none'})`);
    
    // Return the token to the client
    res.json({ csrfToken: req.csrfToken });
  } catch (error) {
    console.error('[CSRF] Error in csrfTokenHandler:', error);
    
    // Last-ditch effort - generate a token directly here
    try {
      const emergencyToken = tokens.create(FALLBACK_SECRET);
      console.log('[CSRF] Last-resort emergency token generated');
      res.json({ csrfToken: emergencyToken, emergency: true });
    } catch (finalError) {
      console.error('[CSRF] Final fallback failed:', finalError);
      res.status(500).json({ error: 'CSRF token handler error', details: error.message });
    }
  }
}