/**
 * API routes for user preferences operations
 * @module routes/api/preferences
 */

import express from 'express';
import topicPreferenceRouter from './topicPreferenceCreation.js';
import currentTopicRouter from './currentTopicRetrieval.js';
import auth from '../../../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Mount all preference related routes
router.use(topicPreferenceRouter);
router.use(currentTopicRouter);

export default router;
