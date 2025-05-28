/**
 * API route for generating test errors
 * @module routes/api/errorLogging/testError
 */

import express from 'express';
import { logError, ERROR_SOURCE, ERROR_SEVERITY } from '../../../services/errorLogger.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route POST /api/log/test/:severity
 * @desc Generate a test error of the specified severity
 * @access Public
 */
router.post('/test/:severity', async (req, res, next) => {
  try {
    const { severity } = req.params;
    let errorSeverity;
    
    // Map the severity parameter to ERROR_SEVERITY
    switch (severity.toUpperCase()) {
      case 'INFO':
        errorSeverity = ERROR_SEVERITY.INFO;
        break;
      case 'WARNING':
        errorSeverity = ERROR_SEVERITY.WARNING;
        break;
      case 'CRITICAL':
        errorSeverity = ERROR_SEVERITY.CRITICAL;
        break;
      case 'ERROR':
      default:
        errorSeverity = ERROR_SEVERITY.ERROR;
        break;
    }
    
    // Create a test error
    const testError = new Error(`Test ${severity} error`);
    testError.code = `TEST_${severity.toUpperCase()}_ERROR`;
    
    // Log the error
    const errorDetails = await logError(
      testError,
      {
        context: 'Test Endpoint',
        severity: errorSeverity,
        source: ERROR_SOURCE.BACKEND,
        metadata: { testTriggered: true, requestBody: req.body }
      },
      req,
      req.clientPool
    );
    
    // Return success with the error details
    res.status(200).json({
      success: true,
      message: `${severity} error logged successfully`,
      errorDetails
    });
  } catch (err) {
    console.error('Error in test endpoint:', err);
    return next(new ApiError('Failed to log test error', 500, { cause: err }));
  }
});

export default router;
