/**
 * API routes for error logging from frontend
 * @module routes/api/errorLogging
 */

import express from 'express';
import errorLoggerRouter from './errorLogger.js';
import testErrorRouter from './testError.js';
import recentErrorsRouter from './recentErrors.js';

const router = express.Router();

// Mount all error logging related routes
router.use(errorLoggerRouter);
router.use(testErrorRouter);
router.use(recentErrorsRouter);

export default router;
