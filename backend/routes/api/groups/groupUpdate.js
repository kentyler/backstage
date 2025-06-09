/**
 * @module routes/api/groups/groupUpdate
 * @description API route for updating groups
 * This module handles PUT operations for updating existing groups.
 * All routes require authentication via the auth middleware.
 */

import express from 'express';
import { updateGroup, removeParticipantFromGroup } from '../../../db/groups/index.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   PUT /api/groups/:id
 * @desc    Update an existing group for the authenticated user's client
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
    
    // Check if pool and client_id are available
    if (!req.pool) {
      console.error('Database connection pool not available');
      return next(new ApiError('Database connection not available', 500));
    }
    
    if (!req.client_id) {
      console.error('Client ID not available in request');
      return next(new ApiError('Authentication required', 401));
    }
    
    console.log('🏢 GROUPS: Updating group', { 
      group_id: groupId, 
      new_name: name.trim(), 
      client_id: req.client_id 
    });
    
    // Update the group
    const updatedGroup = await updateGroup(req.pool, groupId, req.client_id, { name: name.trim() });
    
    if (!updatedGroup) {
      return next(new ApiError(`Group with ID ${groupId} not found`, 404));
    }
    
    console.log('🏢 GROUPS: Updated group:', updatedGroup);
    
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

/**
 * @route   DELETE /api/groups/:id/participants/:participantId
 * @desc    Remove a participant from a group
 * @access  Private (requires authentication)
 * @param   {number} id - The ID of the group
 * @param   {number} participantId - The ID of the participant to remove
 * @returns {Object} Success message
 * @throws  {Error} If database connection fails, validation fails, or query execution fails
 */
router.delete('/:id/participants/:participantId', async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.id);
    const participantId = parseInt(req.params.participantId);
    
    if (isNaN(groupId)) {
      return next(new ApiError('Invalid group ID. Must be a number.', 400));
    }
    
    if (isNaN(participantId)) {
      return next(new ApiError('Invalid participant ID. Must be a number.', 400));
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
    
    console.log('🏢 GROUPS: Removing participant from group', { 
      group_id: groupId, 
      participant_id: participantId,
      client_id: req.client_id 
    });
    
    // Remove participant from group
    await removeParticipantFromGroup(req.pool, participantId, groupId, req.client_id);
    
    return res.json({
      success: true,
      message: 'Participant removed from group successfully'
    });
  } catch (error) {
    console.error('Error removing participant from group:', error);
    return next(new ApiError('Failed to remove participant from group', 500, { cause: error }));
  }
});

export default router;
