/**
 * File Uploads API Routes
 * @module routes/api/fileUploads
 */

import express from 'express';
import uploadRouter from './fileUpload.js';
import retrievalRouter from './fileRetrieval.js';
import listRouter from './fileList.js';
import deleteRouter from './fileDeletion.js';
import searchRouter from './fileSearch.js';
import contentRouter from './fileContent.js';
import auth from '../../../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Mount all file upload related routes
router.use(uploadRouter);
router.use(retrievalRouter);
router.use(listRouter);
router.use(deleteRouter);
router.use(searchRouter);
router.use(contentRouter);

export default router;
