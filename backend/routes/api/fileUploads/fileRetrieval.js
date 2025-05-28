/**
 * File Retrieval API Route
 * @module routes/api/fileUploads/fileRetrieval
 */

import express from 'express';
import { fileUploads } from '../../../db/index.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   GET /api/file-uploads/:id
 * @desc    Get file upload by ID
 * @access  Private (requires authentication via middleware in index.js)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
      return next(new ApiError('Invalid file ID', 400));
    }

    // Get file upload record
    const fileUpload = await fileUploads.getFileUploadById(fileId, req.clientPool);
    if (!fileUpload) {
      return next(new ApiError('File not found', 404));
    }

    res.json(fileUpload);
  } catch (error) {
    console.error('Error getting file:', error);
    return next(new ApiError('Failed to get file', 500, { cause: error }));
  }
});

export default router;
