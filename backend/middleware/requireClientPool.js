/**
 * Middleware to verify that clientPool is available
 * Used after setClientPool middleware to ensure database access is available
 * Uses centralized error handling pattern with ApiError
 */
import { ApiError } from './errorHandler.js';

export const requireClientPool = (req, res, next) => {
  // IMPORTANT: We use direct response for this critical middleware to avoid infinite loops
  // If we passed this to the error handler and the error handler needs a database connection,
  // it could cause an infinite loop when there's no client pool
  if (!req.clientPool) {
    console.error('No clientPool found in request object');
    // Log the error but use direct response instead of next(new ApiError()) to avoid loops
    return res.status(500).json({ 
      error: 'Database connection not available',
      message: 'Server configuration error - no database connection'
    });
  }
  next();
};

export default requireClientPool;
