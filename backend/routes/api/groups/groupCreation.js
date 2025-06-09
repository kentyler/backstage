/**
 * @module routes/api/groups/groupCreation
 * @description API route for creating groups
 * This module handles POST operations for creating new groups.
 * All routes require authentication via the auth middleware.
 */

import express from 'express';
import { createGroup, addParticipantToGroup } from '../../../db/groups/index.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/groups
 * @desc    Create a new group for the authenticated user's client
 * @access  Private (requires authentication)
 * @param   {string} name - The name of the group (in request body)
 * @returns {Object} Newly created group object
 * @throws  {Error} If database connection fails, validation fails, or query execution fails
 */
router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;
    
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
    
    console.log('🏢 GROUPS: Creating group', { name: name.trim(), client_id: req.client_id });
    
    // Create the group
    const newGroup = await createGroup(req.pool, name.trim(), req.client_id);
    console.log('🏢 GROUPS: Created new group:', newGroup);
    
    return res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group: newGroup
    });
  } catch (error) {
    console.error('Error creating group:', error);
    
    // Check for duplicate name error (PostgreSQL error code 23505 is for unique violation)
    if (error.code === '23505') {
      return next(new ApiError('A group with this name already exists', 409));
    }
    
    return next(new ApiError('Failed to create group', 500, { cause: error }));
  }
});

/**
 * @route   POST /api/groups/:id/participants
 * @desc    Add a participant to a group
 * @access  Private (requires authentication)
 * @param   {number} id - The ID of the group
 * @param   {number} participant_id - The ID of the participant to add (in request body)
 * @param   {number} [participant_role_id=1] - The role ID for the participant (in request body)
 * @returns {Object} Success message with membership details
 * @throws  {Error} If database connection fails, validation fails, or query execution fails
 */
router.post('/:id/participants', async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.id);
    const { participant_id, participant_role_id = 1 } = req.body;
    
    if (isNaN(groupId)) {
      return next(new ApiError('Invalid group ID. Must be a number.', 400));
    }
    
    if (!participant_id || isNaN(parseInt(participant_id))) {
      return next(new ApiError('Valid participant ID is required', 400));
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
    
    console.log('🏢 GROUPS: Adding participant to group', { 
      group_id: groupId, 
      participant_id: parseInt(participant_id),
      client_id: req.client_id 
    });
    
    // Add participant to group
    const membership = await addParticipantToGroup(
      req.pool, 
      parseInt(participant_id), 
      groupId, 
      req.client_id, 
      parseInt(participant_role_id)
    );
    
    return res.status(201).json({
      success: true,
      message: 'Participant added to group successfully',
      membership
    });
  } catch (error) {
    console.error('Error adding participant to group:', error);
    return next(new ApiError('Failed to add participant to group', 500, { cause: error }));
  }
});

export default router;
