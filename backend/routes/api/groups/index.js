/**
 * @module routes/api/groups
 * @description API routes for group operations
 * This module combines all the modular routers for group operations.
 * All routes require authentication via the auth middleware.
 */

import express from 'express';
import groupsRetrievalRouter from './groupsRetrieval.js';
import groupCreationRouter from './groupCreation.js';
import groupUpdateRouter from './groupUpdate.js';
import groupDeletionRouter from './groupDeletion.js';

const router = express.Router();

// Mount all the group-related routers
router.use(groupsRetrievalRouter);
router.use(groupCreationRouter);
router.use(groupUpdateRouter);
router.use(groupDeletionRouter);

export default router;
