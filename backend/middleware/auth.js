/**
 * Authentication middleware
 * Checks if the user is authenticated by verifying the presence of userId in the session
 * Uses centralized error handling pattern with ApiError
 */
import { ApiError } from './errorHandler.js';

export const auth = (req, res, next) => {
  if (req.session?.userId) {
    return next();
  }
  
  return next(new ApiError('Authentication required', 401));
};

export default auth;
