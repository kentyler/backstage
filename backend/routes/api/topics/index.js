import express from 'express';
import topicCreationRouter from './topicCreation.js';
import topicRetrievalRouter from './topicRetrieval.js';
import topicUpdateRouter from './topicUpdate.js';
import topicDeletionRouter from './topicDeletion.js';

const router = express.Router();

// Mount all the topic-related routers
router.use(topicCreationRouter);
router.use(topicRetrievalRouter);
router.use(topicUpdateRouter);
router.use(topicDeletionRouter);

export default router;
