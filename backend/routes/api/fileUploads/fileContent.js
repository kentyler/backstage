/**
 * File Content API Route
 * @module routes/api/fileUploads/fileContent
 */

import express from 'express';
import { fileUploads, fileUploadVectors } from '../../../db/index.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   GET /api/file-uploads/:id/content
 * @desc    Get the processed content of a file with its vectors
 * @access  Private (requires authentication via middleware in index.js)
 */
router.get('/:id/content', async (req, res, next) => {
  try {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
      return next(new ApiError('Invalid file ID', 400));
    }

    // Ensure we have a client pool
    if (!req.clientPool) {
      console.error('No client pool available for file content retrieval');
      return next(new ApiError('Database connection not available', 500));
    }

    // Get file upload record
    const fileUpload = await fileUploads.getFileUploadById(fileId, req.clientPool);
    if (!fileUpload) {
      return next(new ApiError('File not found', 404));
    }

    // Get file content vectors
    const vectors = await fileUploadVectors.getFileUploadVectors(fileId, req.clientPool);
    
    // Return the file info with its content chunks
    res.json({
      file: fileUpload,
      chunks: vectors.map(v => ({
        chunkIndex: v.chunk_index,
        contentText: v.content_text
      }))
    });
  } catch (error) {
    console.error('Error getting file content:', error);
    return next(new ApiError('Failed to get file content', 500, { cause: error }));
  }
});

export default router;
