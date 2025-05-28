/**
 * API routes for comment handling
 * @module routes/api/comments
 */

import express from 'express';
import commentCreationRouter from './commentCreation.js';
import auth from '../../../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Mount all comment related routes
router.use(commentCreationRouter);

export default router;
