/**
 * API route for logging frontend errors
 * @module routes/api/errorLogging/errorLogger
 */

import express from 'express';
import { logError, ERROR_SOURCE } from '../../../services/errorLogger.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route POST /api/log/error
 * @desc Log errors from the frontend
 * @access Public
 */
router.post('/error', async (req, res, next) => {
  try {
    const errorDetails = req.body;
    
    if (!errorDetails || !errorDetails.message) {
      return next(new ApiError('Error details are required with at least a message', 400));
    }
    
    // Create an error object from the details
    const error = new Error(errorDetails.message);
    error.stack = errorDetails.stack;
    error.code = errorDetails.code;
    
    // Log the error from the frontend
    await logError(
      error,
      {
        context: errorDetails.context || 'Frontend',
        severity: errorDetails.severity,
        source: ERROR_SOURCE.FRONTEND,
        metadata: errorDetails
      },
      req,
      req.clientPool
    );
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error logging frontend error:', err);
    return next(new ApiError('Failed to log frontend error', 500, { cause: err }));
  }
});

export default router;
