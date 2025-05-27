import express from 'express';
import { deleteTopicPath as dbDeleteTopicPath } from '../../../db/topic-paths/index.js';
import auth from '../../../middleware/auth.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route   POST /api/topics/delete
 * @desc    Delete a topic path using POST with path in request body
 * @access  Private
 */
router.post('/delete', async (req, res) => {
  try {
    console.log('Received delete request with body:', req.body);
    const { path } = req.body;
    
    if (!path) {
      console.log('Error: Path is required in request body');
      return res.status(400).json({ error: 'Path is required in request body' });
    }
    
    // Authentication is handled by the auth middleware
    
    console.log('Attempting to delete topic path:', path);
    
    try {
      const result = await dbDeleteTopicPath(req.clientPool, path);
      console.log('Successfully deleted topic path:', result);
      return res.status(204).send();
    } catch (dbError) {
      console.error('Database error deleting topic path:', {
        error: dbError.message,
        stack: dbError.stack,
        path: path,
        userId: req.session.userId
      });
      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Error in delete topic endpoint:', {
      error: error.message,
      stack: error.stack,
      path: req.body.path,
      userId: req.session?.userId
    });
    
    res.status(500).json({ 
      error: 'Failed to delete topic path',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
    });
  }
});

/**
 * @route   DELETE /api/topics/:path(*)
 * @desc    Delete a topic path
 * @access  Private
 */
router.delete('/:path(*)', async (req, res, next) => {
  try {
    console.log('Received delete request for path:', req.params.path);
    const path = req.params.path;
    
    if (!path) {
      console.log('Error: Path is required');
      return next(new ApiError('Path is required', 400));
    }
    
    // Authentication is handled by the auth middleware
    
    // Decode the path in case it contains encoded characters
    const decodedPath = decodeURIComponent(path);
    console.log('Decoded path:', decodedPath);
    
    try {
      console.log('Attempting to delete topic path:', decodedPath);
      // Pass the pool first, then the path
      const result = await dbDeleteTopicPath(req.clientPool, decodedPath);
      console.log('Successfully deleted topic path:', result);
      return res.status(204).send();
    } catch (dbError) {
      console.error('Database error deleting topic path:', {
        error: dbError.message,
        stack: dbError.stack,
        path: decodedPath,
        userId: req.session.userId
      });
      // Convert database error to ApiError and pass to next()
      return next(new ApiError(`Failed to delete topic '${decodedPath}'`, 500, { cause: dbError }));
    }
  } catch (error) {
    console.error('Error in delete topic endpoint:', {
      error: error.message,
      stack: error.stack,
      path: req.params.path,
      userId: req.session?.userId
    });
    
    // If it's already an ApiError, pass it along
    if (error instanceof ApiError) {
      return next(error);
    }
    
    // Otherwise, convert it to an ApiError
    return next(new ApiError('Failed to delete topic path', 500, { originalError: error.message }));
  }
});

export default router;
