// src/middleware/auth.js
import jwt from 'jsonwebtoken';

// pull in the same secret you use to sign
const { JWT_SECRET } = process.env;

/**
 * Express middleware that:
 * 1. Looks for an Authorization: Bearer <token> header
 * 2. Verifies the JWT
 * 3. Attaches the decoded payload to req.user
 * 4. Returns 401 if missing or invalid
 */
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed auth header' });
  }

  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;            // e.g. { participantId, email, iat, exp }
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
