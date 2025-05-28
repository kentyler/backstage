/**
 * API routes for authentication
 * @module routes/api/auth
 */

import express from 'express';
import loginRouter from './login.js';
import logoutRouter from './logout.js';
import statusRouter from './status.js';
import testRouter from './test.js';

const router = express.Router();

// Mount all authentication related routes
router.use(loginRouter);
router.use(logoutRouter);
router.use(statusRouter);
router.use(testRouter);

export default router;
