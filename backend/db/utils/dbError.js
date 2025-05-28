/**
 * Database error utilities
 * @module db/utils/dbError
 * @description Provides utilities for consistent database error handling
 */

/**
 * Creates a standardized database error with consistent metadata
 * This allows route handlers to easily translate these errors to ApiErrors
 * 
 * @param {string} message - Error message
 * @param {Object} options - Error options
 * @param {string} options.code - Error code (e.g., 'RECORD_NOT_FOUND')
 * @param {number} options.status - HTTP status code equivalent (e.g., 404)
 * @param {Object} options.context - Additional error context
 * @param {Error} [options.cause] - Original error that caused this error
 * @returns {Error} Enhanced error object
 */
export function createDbError(message, { code, status = 500, context = {}, cause = null }) {
  const error = cause ? new Error(message, { cause }) : new Error(message);
  
  // Add standardized metadata
  error.code = code;
  error.status = status;
  error.context = context;
  error.isDbError = true; // Flag to identify database errors
  
  return error;
}

/**
 * Common error codes with descriptions and default status codes
 */
export const DB_ERROR_CODES = {
  // Not Found errors
  RECORD_NOT_FOUND: { status: 404, description: 'Record not found' },
  TOPIC_PATH_NOT_FOUND: { status: 404, description: 'Topic path not found' },
  
  // Validation errors
  VALIDATION_ERROR: { status: 400, description: 'Validation error' },
  INVALID_DATA: { status: 400, description: 'Invalid data provided' },
  
  // Conflict errors
  DUPLICATE_RECORD: { status: 409, description: 'Duplicate record' },
  REFERENCE_CONFLICT: { status: 409, description: 'Cannot modify due to references' },
  
  // Server errors
  DB_CONNECTION_ERROR: { status: 500, description: 'Database connection error' },
  QUERY_ERROR: { status: 500, description: 'Database query error' },
  TRANSACTION_ERROR: { status: 500, description: 'Database transaction error' }
};
