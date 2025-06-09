/**
 * @module routes/api/groups/groupDeletion
 * @description API route for deleting groups
 * This module handles DELETE operations for removing groups.
 * All routes require authentication via the auth middleware.
 */

import express from 'express';
import { deleteGroup } from '../../../db/groups/index.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   DELETE /api/groups/:id
 * @desc    Delete an existing group for the authenticated user's client
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
    
    // Check if pool and client_id are available
    if (!req.pool) {
      console.error('Database connection pool not available');
      return next(new ApiError('Database connection not available', 500));
    }
    
    if (!req.client_id) {
      console.error('Client ID not available in request');
      return next(new ApiError('Authentication required', 401));
    }
    
    console.log('🏢 GROUPS: Deleting group', { 
      group_id: groupId, 
      client_id: req.client_id 
    });
    
    // Delete the group (this will also verify it belongs to the client)
    await deleteGroup(req.pool, groupId, req.client_id);
    console.log(`🏢 GROUPS: Deleted group with ID ${groupId}`);
    
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
