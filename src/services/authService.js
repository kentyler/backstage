
/**
 * @file src/services/authService.js
 * @description reusable JWT logic
 */

import jwt from 'jsonwebtoken';

/**
 * creates a JWT token
 * 
 * @param payload
*/
export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
}

/**
 * verifies a JWT token
 * 
 * @param token
 */
export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
