/**
 * Error logging service for centralized tracking and handling of errors
 * @module services/errorLogger
 */

import { logEvent, EVENT_CATEGORY, EVENT_TYPE } from './eventLogger.js';

/**
 * Error severity levels
 * @enum {string}
 */
export const ERROR_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Error sources
 * @enum {string}
 */
export const ERROR_SOURCE = {
  BACKEND: 'backend',
  FRONTEND: 'frontend',
  DATABASE: 'database',
  EXTERNAL_API: 'external_api'
};

/**
 * Log an error to the event logging system
 * @param {Error} error - The error object
 * @param {Object} options - Error logging options
 * @param {string} options.context - Where the error occurred (e.g., "GET /api/topics")
 * @param {string} [options.severity=ERROR_SEVERITY.ERROR] - Error severity level
 * @param {string} [options.source=ERROR_SOURCE.BACKEND] - Error source
 * @param {Object} [options.metadata={}] - Additional error metadata
 * @param {Object} [req=null] - Express request object (optional)
 * @param {Object} [clientPool=null] - Database client pool
 * @returns {Object} Error details object
 */
export async function logError(error, options, req = null, clientPool = null) {
  const {
    context,
    severity = ERROR_SEVERITY.ERROR,
    source = ERROR_SOURCE.BACKEND,
    metadata = {}
  } = options;

  // Determine appropriate event type based on severity
  let eventType;
  switch (severity) {
    case ERROR_SEVERITY.INFO:
      eventType = EVENT_TYPE.INFO;
      break;
    case ERROR_SEVERITY.WARNING:
      eventType = EVENT_TYPE.WARNING;
      break;
    case ERROR_SEVERITY.CRITICAL:
      eventType = EVENT_TYPE.CRITICAL_ERROR;
      break;
    case ERROR_SEVERITY.ERROR:
    default:
      eventType = EVENT_TYPE.ERROR;
      break;
  }

  const errorDetails = {
    message: error.message || 'Unknown error',
    stack: error.stack,
    code: error.code || 'UNKNOWN_ERROR',
    context,
    severity,
    source,
    timestamp: new Date().toISOString(),
    ...metadata
  };

  // Add request information if available
  if (req) {
    errorDetails.requestInfo = {
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    };
  }

  // Log to console for development
  console.error(`[${severity.toUpperCase()}] Error in ${context}:`, error.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }

  // If clientPool is available, log to the event system
  if (clientPool) {
    try {
      const schemaName = req?.schemaName || 'public';
      await logEvent({
        schemaName,
        participantId: req?.session?.userId || null,
        eventType,
        eventCategory: EVENT_CATEGORY.ERROR,
        description: `${severity.toUpperCase()} in ${context}: ${error.message}`,
        details: errorDetails,
        ipAddress: req?.ip,
        userAgent: req?.headers?.['user-agent']
      }, clientPool);
    } catch (logError) {
      // If logging to the database fails, at least log to console
      console.error('Error while logging error to database:', logError);
    }
  }

  return errorDetails;
}

/**
 * Create a middleware function for Express error handling
 * @returns {Function} Express error middleware
 */
export function createErrorMiddleware() {
  return async (err, req, res, next) => {
    // Log the error
    const errorDetails = await logError(
      err,
      {
        context: `${req.method} ${req.originalUrl}`,
        severity: err.critical ? ERROR_SEVERITY.CRITICAL : ERROR_SEVERITY.ERROR,
        source: ERROR_SOURCE.BACKEND
      },
      req,
      req.clientPool
    );

    // Determine status code
    const statusCode = err.statusCode || 500;
    
    // Send appropriate response
    // Only send detailed error info in development
    res.status(statusCode).json({
      error: {
        message: err.message || 'An unexpected error occurred',
        code: err.code || 'INTERNAL_SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && { details: errorDetails })
      }
    });
  };
}
