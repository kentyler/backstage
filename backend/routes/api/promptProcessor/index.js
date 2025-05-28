/**
 * API routes for prompt processing
 * @module routes/api/promptProcessor
 */

import express from 'express';
import messageProcessorRouter from './messageProcessor.js';
import commentProcessorRouter from './commentProcessor.js';
import requireClientPool from '../../../middleware/requireClientPool.js';

const router = express.Router();

// Mount all prompt processing related routes
router.use(messageProcessorRouter);
router.use(commentProcessorRouter);

export default router;
