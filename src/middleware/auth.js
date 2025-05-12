// src/middleware/auth.js
import jwt from 'jsonwebtoken';

// pull in the same secret you use to sign
const { JWT_SECRET } = process.env;

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
    cookie: false,
    header: false,
    verified: false
  };

  // 1. Extract token from multiple possible sources
  let token;
  let tokenSource = 'none';
  
  // Check for token in Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
    tokenSource = 'header';
    authAttempts.header = true;
    console.log('Found JWT token in Authorization header');
  } 
  
  // If no token in header, check cookies
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
    tokenSource = 'cookie';
    authAttempts.cookie = true;
    console.log('Found JWT token in cookies');
  }

  // 2. If no token from any source, reject
  if (!token) {
    console.log('Authentication failed: No token found in cookies or Authorization header');
    return res.status(401).json({ 
      error: 'Missing auth token', 
      details: 'No authentication token found in request cookies or Authorization header',
      attempted: authAttempts
    });
  }

  // 3. Verify and attach payload
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;  // e.g. { participantId, iat, exp }
    req.authSource = tokenSource; // Track which source provided the valid token
    authAttempts.verified = true;
    console.log(`Successfully authenticated user ${payload.participantId} using ${tokenSource} token`);
    return next();
  } catch (err) {
    console.error(`Authentication error with ${tokenSource} token:`, err.message);
    return res.status(401).json({ 
      error: 'Invalid or expired token', 
      details: err.message,
      attempted: authAttempts
    });
  }
}
