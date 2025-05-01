// src/middleware/auth.js
import jwt from 'jsonwebtoken';

// pull in the same secret you use to sign
const { JWT_SECRET } = process.env;

/**
 * Express middleware that:
 * 1. Reads a JWT from Authorization header or HttpOnly cookie
 * 2. Verifies the JWT
 * 3. Attaches the decoded payload to req.user
 * 4. Returns 401 if missing or invalid
 */
export function requireAuth(req, res, next) {
  // 1. Extract token from header or cookie
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. If no token, reject
  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  // 3. Verify and attach payload
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;  // e.g. { participantId, iat, exp }
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
