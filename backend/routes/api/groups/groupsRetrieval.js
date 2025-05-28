/**
 * @module routes/api/groups/groupsRetrieval
 * @description API routes for retrieving groups
 * This module handles GET operations for groups.
 * All routes require authentication via the auth middleware.
 */

import express from 'express';
import { getAllGroups, getGroupById } from '../../../db/groups/index.js';
import auth from '../../../middleware/auth.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route   GET /api/groups
 * @desc    Get all groups from the database
 * @access  Private (requires authentication)
 * @returns {Array} Array of group objects with their properties
 * @throws  {Error} If database connection fails or query execution fails
 */
router.get('/', async (req, res, next) => {
  try {
    console.log('Fetching groups from database...');
    
    // Check if clientPool is available
    if (!req.clientPool) {
      console.error('Database connection pool not available');
      return next(new ApiError('Database connection not available', 500));
    }
    
    const groups = await getAllGroups(req.clientPool);
    return res.json({ 
      success: true, 
      groups 
    });
  } catch (error) {
    console.error('Error retrieving groups:', error);
    return next(new ApiError('Failed to retrieve groups', 500, { cause: error }));
  }
});

/**
 * @route   GET /api/groups/:id
 * @desc    Get a specific group by ID
 * @access  Private (requires authentication)
 * @param   {number} id - The ID of the group to retrieve
 * @returns {Object} Group object with its properties
 * @throws  {Error} If database connection fails, group not found, or query execution fails
 */
router.get('/:id', async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.id);
    
    if (isNaN(groupId)) {
      return next(new ApiError('Invalid group ID. Must be a number.', 400));
    }
    
    // Check if clientPool is available
    if (!req.clientPool) {
      console.error('Database connection pool not available');
      return next(new ApiError('Database connection not available', 500));
    }
    
    const group = await getGroupById(groupId, req.clientPool);
    
    if (!group) {
      return next(new ApiError(`Group with ID ${groupId} not found`, 404));
    }
    
    return res.json({
      success: true,
      group
    });
  } catch (error) {
    console.error(`Error retrieving group with ID ${req.params.id}:`, error);
    return next(new ApiError('Failed to retrieve group', 500, { cause: error }));
  }
});

export default router;
