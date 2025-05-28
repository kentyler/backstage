/**
 * API routes for message searching and similarity
 * @module routes/api/messageSearch
 */

import express from 'express';
import relatedMessagesRouter from './relatedMessages.js';
import auth from '../../../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Mount all message search related routes
router.use(relatedMessagesRouter);

export default router;
