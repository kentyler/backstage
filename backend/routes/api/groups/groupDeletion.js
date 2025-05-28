/**
 * @module routes/api/groups/groupDeletion
 * @description API route for deleting groups
 * This module handles DELETE operations for removing groups.
 * All routes require authentication via the auth middleware.
 */

import express from 'express';
import { deleteGroup, getGroupById } from '../../../db/groups/index.js';
import auth from '../../../middleware/auth.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route   DELETE /api/groups/:id
 * @desc    Delete an existing group
 * @access  Private (requires authentication)
 * @param   {number} id - The ID of the group to delete
 * @returns {Object} Success message
 * @throws  {Error} If database connection fails, validation fails, group not found, or query execution fails
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.id);
    
    // Validate ID
    if (isNaN(groupId)) {
      return next(new ApiError('Invalid group ID. Must be a number.', 400));
    }
    
    // Check if clientPool is available
    if (!req.clientPool) {
      console.error('Database connection pool not available');
      return next(new ApiError('Database connection not available', 500));
    }
    
    // Check if group exists
    const existingGroup = await getGroupById(groupId, req.clientPool);
    if (!existingGroup) {
      return next(new ApiError(`Group with ID ${groupId} not found`, 404));
    }
    
    // Delete the group
    await deleteGroup(groupId, req.clientPool);
    console.log(`Deleted group with ID ${groupId}`);
    
    // Return 204 No Content for successful deletion
    return res.status(204).send();
  } catch (error) {
    console.error(`Error deleting group with ID ${req.params.id}:`, error);
    
    // Check for foreign key constraint violation (PostgreSQL error code 23503)
    if (error.code === '23503') {
      return next(new ApiError('Cannot delete group because it is referenced by other records', 409));
    }
    
    return next(new ApiError('Failed to delete group', 500, { cause: error }));
  }
});

export default router;
