/**
 * @module routes/api/topicPaths/pathsDeletion
 * @description API routes for deleting topic paths
 * This module handles DELETE operations for topic paths.
 * All routes require authentication via the auth middleware.
 */

import express from 'express';
import { deleteTopicPath } from '../../../db/topic-paths/index.js';
import auth from '../../../middleware/auth.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route   DELETE /api/topic-paths/:path
 * @desc    Delete a specific topic path
 * @access  Private (requires authentication)
 * @param   {string} path - The topic path to delete
 * @returns {Object} Success message
 * @throws  {Error} If database connection fails or deletion fails
 */
router.delete('/:path(*)', async (req, res, next) => {
  try {
    const path = req.params.path;
    console.log(`Attempting to delete topic path: ${path}`);
    
    if (!path) {
      console.log('Error: Path parameter is required');
      return next(new ApiError('Path parameter is required', 400));
    }
    
    // Ensure we have a client pool
    if (!req.clientPool) {
      console.error('No client pool available for topic path deletion');
      return next(new ApiError('Database connection not available', 500));
    }
    
    // Authentication is handled by the auth middleware
    try {
      const result = await deleteTopicPath(req.clientPool, path);
      console.log(`Successfully deleted topic path: ${path}`);
      
      // Return 204 No Content for successful deletion
      return res.status(204).send();
    } catch (dbError) {
      console.error('Database error deleting topic path:', dbError);
      return next(new ApiError(`Failed to delete topic path: ${path}`, 500, { cause: dbError }));
    }
  } catch (error) {
    console.error('Error in delete topic path endpoint:', error);
    return next(new ApiError('Failed to process delete request', 500, { cause: error }));
  }
});

/**
 * @route   POST /api/topic-paths/delete
 * @desc    Delete a topic path using POST with path in request body
 * @access  Private (requires authentication)
 * @param   {string} path - The topic path to delete (in request body)
 * @returns {Object} Success message
 * @throws  {Error} If database connection fails or deletion fails
 */
router.post('/delete', async (req, res, next) => {
  try {
    const { path } = req.body;
    console.log(`Attempting to delete topic path from request body: ${path}`);
    
    if (!path) {
      console.log('Error: Path is required in request body');
      return next(new ApiError('Path is required in request body', 400));
    }
    
    // Ensure we have a client pool
    if (!req.clientPool) {
      console.error('No client pool available for topic path deletion');
      return next(new ApiError('Database connection not available', 500));
    }
    
    // Authentication is handled by the auth middleware
    try {
      const result = await deleteTopicPath(req.clientPool, path);
      console.log(`Successfully deleted topic path: ${path}`);
      
      // Return 204 No Content for successful deletion
      return res.status(204).send();
    } catch (dbError) {
      console.error('Database error deleting topic path:', dbError);
      return next(new ApiError(`Failed to delete topic path: ${path}`, 500, { cause: dbError }));
    }
  } catch (error) {
    console.error('Error in delete topic path endpoint:', error);
    return next(new ApiError('Failed to process delete request', 500, { cause: error }));
  }
});

export default router;
