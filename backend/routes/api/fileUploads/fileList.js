/**
 * File List API Route
 * @module routes/api/fileUploads/fileList
 */

import express from 'express';
import { fileUploads } from '../../../db/index.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   GET /api/file-uploads
 * @desc    List file uploads with pagination and filtering
 * @access  Private (requires authentication via middleware in index.js)
 */
router.get('/', async (req, res, next) => {
  try {
    // Parse query parameters
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || null;
    const tags = req.query.tags ? JSON.parse(req.query.tags) : null;

    // Get file uploads
    const result = await fileUploads.getFileUploadsBySchema({
      limit,
      offset,
      search,
      tags
    }, req.clientPool);

    res.json(result);
  } catch (error) {
    console.error('Error listing files:', error);
    return next(new ApiError('Failed to list files', 500, { cause: error }));
  }
});

export default router;
