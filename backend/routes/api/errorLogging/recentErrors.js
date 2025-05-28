/**
 * API route for retrieving recent error logs
 * @module routes/api/errorLogging/recentErrors
 */

import express from 'express';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route GET /api/log/recent
 * @desc Get recent error logs
 * @access Public
 */
router.get('/recent', async (req, res, next) => {
  try {
    // Make sure we have a client pool
    if (!req.clientPool) {
      return next(new ApiError('Database connection not available', 500));
    }
    
    const client = await req.clientPool.connect();
    
    try {
      const schemaName = req.schemaName || 'public';
      await client.query('SET search_path TO $1, public', [schemaName]);
      
      // Query recent logs from the participant_event_logs table
      // Show all event types, including login events
      const result = await client.query(`
        SELECT * FROM participant_event_logs
        ORDER BY created_at DESC
        LIMIT 20
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
    return next(new ApiError('Failed to fetch logs', 500, { cause: error }));
  }
});

export default router;
