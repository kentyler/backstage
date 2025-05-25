/**
 * API routes for error logging from frontend
 * @module routes/api/errorLogging
 */

import express from 'express';
import { logError, ERROR_SOURCE, ERROR_SEVERITY } from '../../services/errorLogger.js';

const router = express.Router();

/**
 * @route POST /api/log/error
 * @desc Log errors from the frontend
 * @access Public
 */
router.post('/error', async (req, res) => {
  try {
    const errorDetails = req.body;
    
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
    res.status(500).json({ success: false });
  }
});

/**
 * @route POST /api/log/test/:severity
 * @desc Generate a test error of the specified severity
 * @access Public
 */
router.post('/test/:severity', async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: 'Failed to log test error',
      error: err.message
    });
  }
});

/**
 * @route GET /api/log/recent
 * @desc Get recent error logs
 * @access Public
 */
router.get('/recent', async (req, res) => {
  try {
    const client = await req.clientPool.connect();
    
    try {
      const schemaName = req.schemaName || 'public';
      await client.query('SET search_path TO $1, public', [schemaName]);
      
      // Query recent logs from the participant_event_logs table
      const result = await client.query(`
        SELECT * FROM participant_event_logs
        WHERE event_category = 'error'
        ORDER BY created_at DESC
        LIMIT 10
      `);
      
      res.json({
        logs: result.rows,
        count: result.rowCount
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs',
      error: error.message
    });
  }
});

export default router;
