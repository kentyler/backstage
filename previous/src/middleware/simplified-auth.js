// simplified-auth.js
import jwt from 'jsonwebtoken';

/**
 * A simplified authentication middleware that prioritizes HTTP-only cookies
 * but provides a clear fallback mechanism for bearer tokens.
 * 
 * This avoids complex conditional logic and provides consistent
 * authentication across environments.
 */
export const authenticate = (req, res, next) => {
  // Step 1: Log the authentication attempt for diagnostics
  console.log(`[Auth] Authenticating request to ${req.path}`);
  console.log(`[Auth] Cookies present: ${Object.keys(req.cookies || {}).join(', ')}`);
  
  // Step 2: Check for JWT token in order of preference
  // First priority: Cookie
  // Second priority: Authorization header
  let token = null;
  
  // Get token from cookie if available
  if (req.cookies && req.cookies.token) {
    console.log('[Auth] Found token in cookies');
    token = req.cookies.token;
  } 
  // Fallback to Authorization header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    console.log('[Auth] Found token in Authorization header');
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Step 3: No token found = unauthorized
  if (!token) {
    console.log('[Auth] No token found, authentication failed');
    return res.status(401).json({ error: 'Unauthorized - no token provided' });
  }
  
  // Step 4: Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`[Auth] Token verified successfully for participant ${decoded.participantId}`);
    
    // Set user data on request object
    req.user = decoded;
    
    // Continue to the protected route
    next();
  } catch (error) {
    console.error(`[Auth] Token verification failed: ${error.message}`);
    return res.status(401).json({ error: 'Unauthorized - invalid token' });
  }
};

export default authenticate;
