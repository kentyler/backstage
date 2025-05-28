/**
 * File Search API Route
 * @module routes/api/fileUploads/fileSearch
 */

import express from 'express';
import { searchFileContent } from '../../../services/fileProcessing.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/file-uploads/search
 * @desc    Search file contents using semantic similarity
 * @access  Private (requires authentication via middleware in index.js)
 */
router.post('/search', async (req, res, next) => {
  try {
    const { query, limit, threshold } = req.body;
    
    if (!query) {
      return next(new ApiError('Search query is required', 400));
    }

    // Ensure we have a client pool
    if (!req.clientPool) {
      console.error('No client pool available for file search');
      return next(new ApiError('Database connection not available', 500));
    }

    // Perform search
    const results = await searchFileContent(query, {
      limit: limit || 5,
      threshold: threshold || 0.7
    }, req.clientPool);

    res.json({ results });
  } catch (error) {
    console.error('Error searching files:', error);
    return next(new ApiError('Failed to search files', 500, { cause: error }));
  }
});

export default router;
