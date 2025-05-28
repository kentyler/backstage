/**
 * @module routes/api/groups/groupUpdate
 * @description API route for updating groups
 * This module handles PUT operations for updating existing groups.
 * All routes require authentication via the auth middleware.
 */

import express from 'express';
import { updateGroup, getGroupById } from '../../../db/groups/index.js';
import auth from '../../../middleware/auth.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route   PUT /api/groups/:id
 * @desc    Update an existing group
 * @access  Private (requires authentication)
 * @param   {number} id - The ID of the group to update
 * @param   {string} name - The new name for the group (in request body)
 * @returns {Object} Updated group object
 * @throws  {Error} If database connection fails, validation fails, group not found, or query execution fails
 */
router.put('/:id', async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.id);
    const { name } = req.body;
    
    // Validate ID
    if (isNaN(groupId)) {
      return next(new ApiError('Invalid group ID. Must be a number.', 400));
    }
    
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return next(new ApiError('Valid group name is required', 400));
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
    
    // Update the group
    const updatedGroup = await updateGroup(groupId, name, req.clientPool);
    console.log('Updated group:', updatedGroup);
    
    return res.json({
      success: true,
      message: 'Group updated successfully',
      group: updatedGroup
    });
  } catch (error) {
    console.error(`Error updating group with ID ${req.params.id}:`, error);
    
    // Check for duplicate name error (PostgreSQL error code 23505 is for unique violation)
    if (error.code === '23505') {
      return next(new ApiError('A group with this name already exists', 409));
    }
    
    return next(new ApiError('Failed to update group', 500, { cause: error }));
  }
});

export default router;
