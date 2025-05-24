/**
 * @module routes/api/topicPaths
 * @description API routes for topic path operations
 * This module handles CRUD operations for topic paths, including retrieving all paths,
 * deleting specific paths, and updating existing paths.
 * All routes require authentication via the auth middleware.
 */

import express from 'express';
import { getTopicPaths, deleteTopicPath, updateTopicPath } from '../../db/topic-paths/index.js';
import auth from '../../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/topic-paths
 * @desc    Get all topic paths from the database
 * @access  Private (requires authentication)
 * @returns {Array} Array of topic path objects with their properties
 * @throws  {Error} If database connection fails or query execution fails
 */
router.get('/', auth, async (req, res) => {
  try {
    // Log the client pool to help with debugging
    console.log('Fetching topic paths with client pool:', req.clientPool ? 'Present' : 'Missing');
    
    // Ensure we have a client pool
    if (!req.clientPool) {
      console.error('No client pool available for topic paths request');
      return res.status(500).json({ error: 'Database connection not available' });
    }
    
    const paths = await getTopicPaths(req.clientPool);
    console.log(`Found ${paths.length} topic paths`);
    res.json(paths);
  } catch (error) {
    console.error('Error fetching topic paths:', error);
    res.status(500).json({ error: 'Failed to fetch topic paths' });
  }
});

/**
 * @route   DELETE /api/topic-paths/:id
 * @desc    Delete a topic path by ID from the database
 * @access  Private (requires authentication)
 * @param   {number} req.params.id - The numeric ID of the topic path to delete
 * @returns {Object} Success message if deletion successful
 * @throws  {Error} If topic path not found, ID is invalid, or database connection fails
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const pathId = parseInt(req.params.id);
    
    if (isNaN(pathId)) {
      return res.status(400).json({ error: 'Invalid topic path ID' });
    }
    
    // Ensure we have a client pool
    if (!req.clientPool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }
    
    const deleted = await deleteTopicPath(pathId, req.clientPool);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Topic path not found' });
    }
    
    res.status(200).json({ success: true, message: 'Topic path deleted successfully' });
  } catch (error) {
    console.error('Error deleting topic path:', error);
    res.status(500).json({ error: 'Failed to delete topic path' });
  }
});

/**
 * @route   PUT /api/topic-paths/:id
 * @desc    Update a topic path by ID in the database
 * @access  Private (requires authentication)
 * @param   {number} req.params.id - The numeric ID of the topic path to update
 * @param   {Object} req.body - The updated topic path properties
 * @param   {string} [req.body.title] - Optional new title for the topic path
 * @param   {string} [req.body.description] - Optional new description for the topic path
 * @param   {boolean} [req.body.active] - Optional flag to set topic path active status
 * @returns {Object} Success message and the updated topic path object
 * @throws  {Error} If topic path not found, ID is invalid, or database connection fails
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const pathId = parseInt(req.params.id);
    
    if (isNaN(pathId)) {
      return res.status(400).json({ error: 'Invalid topic path ID' });
    }
    
    // Ensure we have a client pool
    if (!req.clientPool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }
    
    const { title, description, active } = req.body;
    
    const updated = await updateTopicPath(
      pathId, 
      { title, description, active },
      req.clientPool
    );
    
    if (!updated) {
      return res.status(404).json({ error: 'Topic path not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Topic path updated successfully',
      topicPath: updated
    });
  } catch (error) {
    console.error('Error updating topic path:', error);
    res.status(500).json({ error: 'Failed to update topic path' });
  }
});

export default router;
