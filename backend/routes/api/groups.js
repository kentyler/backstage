/**
 * @module routes/api/groups
 * @description API routes for group-related operations
 * This module handles fetching all groups and retrieving specific groups by ID.
 * All routes require authentication via the auth middleware.
 */

import express from 'express';
import { getAllGroups, getGroupById } from '../../db/groups/index.js';
import auth from '../../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/groups
 * @desc    Get all groups from the database
 * @access  Private (requires authentication)
 * @returns {Array} Array of group objects with their properties
 * @throws  {Error} If database connection fails or query execution fails
 */
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching groups from actual database...');
    
    // Check if clientPool is available
    if (!req.clientPool) {
      console.error('Database connection pool not available');
      return res.status(500).json({ 
        error: 'Database connection not available',
        message: 'The application is unable to access the database.'
      });
    }
    
    // Use the imported getAllGroups function with the client pool
    const groups = await getAllGroups(req.clientPool);
    
    // Log the result for debugging
    console.log(`Found ${groups.length} groups`);
    
    return res.status(200).json(groups);
  } catch (err) {
    console.error('Error fetching groups:', err);
    // Return empty array instead of error to prevent UI crashes (as in previous impl)
    return res.json([]);
  }
});

/**
 * @route   GET /api/groups/:id
 * @desc    Get a specific group by ID from the database
 * @access  Private (requires authentication)
 * @param   {number} req.params.id - The numeric ID of the group to retrieve
 * @returns {Object} Group object with its properties if found
 * @throws  {Error} If group not found, ID is invalid, or database connection fails
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    
    if (isNaN(groupId)) {
      return res.status(400).json({ error: 'Invalid group ID' });
    }
    
    // Check if clientPool is available
    if (!req.clientPool) {
      console.error('Database connection pool not available');
      return res.status(500).json({ 
        error: 'Database connection not available',
        message: 'The application is unable to access the database.'
      });
    }
    
    console.log(`Fetching group ID ${groupId}...`);
    
    // Use the imported getGroupById function with client pool
    const group = await getGroupById(groupId, req.clientPool);
    
    // Check if a group was found
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    return res.status(200).json(group);
  } catch (err) {
    console.error(`Error fetching group by ID:`, err);
    return res.status(500).json({ error: 'Failed to fetch group' });
  }
});

export default router;
