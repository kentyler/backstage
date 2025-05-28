/**
 * API routes for event logging
 * @module routes/api/events
 */

import express from 'express';
import eventLoggerRouter from './eventLogger.js';
import auth from '../../../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Mount all event related routes
router.use(eventLoggerRouter);

export default router;
