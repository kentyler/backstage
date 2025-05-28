/**
 * @module routes/api/topicPaths/index
 * @description Combines all topic path related routers
 * This module imports and combines all the modular routers for topic path operations
 */

import express from 'express';
import pathsRetrievalRouter from './pathsRetrieval.js';
import pathsDeletionRouter from './pathsDeletion.js';
import pathsUpdateRouter from './pathsUpdate.js';
import pathCreationRouter from './pathCreation.js';
import pathsMessageRetrievalRouter from './pathsMessageRetrieval.js';

const router = express.Router();

// Mount all the topic path-related routers
router.use(pathsRetrievalRouter);
router.use(pathsDeletionRouter);
router.use(pathsUpdateRouter);
router.use(pathCreationRouter);
router.use(pathsMessageRetrievalRouter);

export default router;
