/**
 * API route for logging events
 * @module routes/api/events/eventLogger
 */

import express from 'express';
import { logEvent } from '../../../services/eventLogger.js';
import { requireClientPool } from '../../../middleware/requireClientPool.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

// Apply client pool middleware
router.use(requireClientPool);

/**
 * @route   POST /api/events/log
 * @desc    Log a user event
 * @access  Private (requires authentication via middleware in index.js)
 */
router.post('/log', async (req, res, next) => {
  try {
    const { eventType, description, details } = req.body;
    
    // Get participant ID from session
    const participantId = req.session?.userId;
    
    if (!participantId) {
      return next(new ApiError('Authentication required to log events', 401));
    }
    
    if (!eventType) {
      return next(new ApiError('Event type is required', 400));
    }
    
    // Ensure we have a client pool
    if (!req.clientPool) {
      console.error('No client pool available for event logging');
      return next(new ApiError('Database connection not available', 500));
    }
    
    // Log the event
    const result = await logEvent({
      schemaName: req.schemaName || 'public',
      participantId,
      eventType,
      description: description || 'No description provided',
      details,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }, req.clientPool);
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Event logged successfully',
      data: result
    });
  } catch (error) {
    console.error('Error logging event:', error);
    return next(new ApiError('Server error while logging event', 500, { 
      cause: error,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }));
  }
});

export default router;
