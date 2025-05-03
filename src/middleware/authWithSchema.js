/**
 * Combined middleware for authentication and setting client schema
 * This middleware combines requireAuth and setClientSchema for convenience
 */

import { requireAuth } from './auth.js';
import { setClientSchema } from './setClientSchema.js';

/**
 * Applies both authentication and client schema setting middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function authWithSchema(req, res, next) {
  // First apply authentication middleware
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    
    // Then apply schema setting middleware
    setClientSchema(req, res, next);
  });
}