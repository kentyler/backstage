/**
 * @module routes/api/groups/groupCreation
 * @description API route for creating groups
 * This module handles POST operations for creating new groups.
 * All routes require authentication via the auth middleware.
 */

import express from 'express';
import { createGroup } from '../../../db/groups/index.js';
import auth from '../../../middleware/auth.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route   POST /api/groups
 * @desc    Create a new group
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
    
    // Check if clientPool is available
    if (!req.clientPool) {
      console.error('Database connection pool not available');
      return next(new ApiError('Database connection not available', 500));
    }
    
    // Create the group
    const newGroup = await createGroup(name, req.clientPool);
    console.log('Created new group:', newGroup);
    
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

export default router;
