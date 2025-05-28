/**
 * API routes for LLM configuration
 * @module routes/api/llmConfig
 */

import express from 'express';
import configRetrievalRouter from './configRetrieval.js';
import configUpdateRouter from './configUpdate.js';

const router = express.Router();

// Mount all LLM config related routes
router.use(configRetrievalRouter);
router.use(configUpdateRouter);

export default router;
