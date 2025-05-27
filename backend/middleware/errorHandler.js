/**
 * Error handling middleware for standardized API error responses
 * @module middleware/errorHandler
 */

import { logEvent, EVENT_CATEGORY, EVENT_TYPE } from '../services/eventLogger.js';

/**
 * Custom API error class with status code and optional details
 */
export class ApiError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized error handler middleware
 * Standardizes error responses and logs errors to the event system
 */
export const errorHandler = async (err, req, res, next) => {
  // Default values
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  let details = err.details || null;
  
  // Handle case where error might be a string or simple object
  if (typeof err === 'string') {
    details = { message: err };
  } else if (err instanceof Error) {
    details = { 
      name: err.name, 
      message: err.message,
      ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    };
  }
  
  // Log the error to our event system if we have a client pool
  // This will be skipped for routes that don't go through setClientPool middleware
  console.log('========== ERROR HANDLER DEBUG ==========');
  console.log('Request path:', req.path);
  console.log('Has clientPool:', !!req.clientPool);
  console.log('Client pool type:', typeof req.clientPool);
  console.log('Has clientSchema:', !!req.clientSchema);
  console.log('Client schema:', req.clientSchema);
  console.log('Has session:', !!req.session);
  console.log('Session userId:', req.session?.userId);
  console.log('Error message:', message);
  console.log('Error status code:', statusCode);
  
  if (req.clientPool) {
    try {
      console.log('Attempting to log error event to database...');
      // Use the existing event logging system without modification
      const logResult = await logEvent({
        schemaName: req.clientSchema || 'public',
        participantId: req.session?.userId || null,
        eventType: EVENT_TYPE.ERROR,
        eventCategory: EVENT_CATEGORY.ERROR,
        description: message,
        details: {
          path: req.path,
          method: req.method,
          errorDetails: details,
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }, req.clientPool);
      
      console.log('Event logging result:', logResult);
    } catch (logError) {
      console.error('Failed to log error event:', logError);
      console.error('Log error stack:', logError.stack);
    }
  } else {
    console.log('Cannot log error: No client pool available');
  }
  console.log('========== END ERROR HANDLER DEBUG ==========');
  
  // Send standardized response
  res.status(statusCode).json({
    success: false,
    error: message,
    details: process.env.NODE_ENV === 'development' ? details : undefined
  });
};
