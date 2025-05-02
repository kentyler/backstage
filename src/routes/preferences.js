/**
 * @file src/routes/preferences.js
 * @description API routes for managing preferences
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getPreferenceWithFallback,
  createParticipantPreference,
  createGroupPreference,
  createSitePreference,
  getPreferenceTypeByName,
  getAllPreferenceTypes
} from '../db/preferences/index.js';

const router = express.Router();

/**
 * @route GET /api/preferences/types
 * @description Get all preference types
 * @access Private
 */
router.get('/types', requireAuth, async (req, res) => {
  try {
    const preferenceTypes = await getAllPreferenceTypes();
    res.json(preferenceTypes);
  } catch (error) {
    console.error('Error getting preference types:', error);
    res.status(500).json({ error: 'Failed to get preference types' });
  }
});

/**
 * @route GET /api/preferences/:preferenceName
 * @description Get a preference with fallback hierarchy
 * @access Private
 */
router.get('/:preferenceName', requireAuth, async (req, res) => {
  try {
    const { preferenceName } = req.params;
    const { participantId } = req.user;
    
    // Get the participant's current group ID from the request if available
    // This would typically be set by another middleware or from the participant record
    const groupId = req.groupId || null;
    
    const preference = await getPreferenceWithFallback(preferenceName, {
      participantId,
      groupId
    });
    
    res.json(preference);
  } catch (error) {
    console.error(`Error getting preference ${req.params.preferenceName}:`, error);
    res.status(500).json({ error: `Failed to get preference: ${error.message}` });
  }
});

/**
 * @route POST /api/preferences/participant
 * @description Create or update a participant preference
 * @access Private
 */
router.post('/participant', requireAuth, async (req, res) => {
  try {
    const { preferenceName, value } = req.body;
    const { participantId } = req.user;
    
    if (!preferenceName || !value) {
      return res.status(400).json({ error: 'Preference name and value are required' });
    }
    
    // Get the preference type ID
    const preferenceType = await getPreferenceTypeByName(preferenceName);
    if (!preferenceType) {
      return res.status(404).json({ error: `Preference type '${preferenceName}' not found` });
    }
    
    // Create or update the preference
    const preference = await createParticipantPreference(
      participantId,
      preferenceType.id,
      value
    );
    
    res.json(preference);
  } catch (error) {
    console.error('Error creating participant preference:', error);
    res.status(500).json({ error: `Failed to create preference: ${error.message}` });
  }
});

/**
 * @route POST /api/preferences/group
 * @description Create or update a group preference
 * @access Private (admin only)
 */
router.post('/group', requireAuth, async (req, res) => {
  try {
    const { preferenceName, value, groupId } = req.body;
    
    if (!preferenceName || !value || !groupId) {
      return res.status(400).json({ error: 'Preference name, value, and group ID are required' });
    }
    
    // TODO: Check if user has admin rights for this group
    
    // Get the preference type ID
    const preferenceType = await getPreferenceTypeByName(preferenceName);
    if (!preferenceType) {
      return res.status(404).json({ error: `Preference type '${preferenceName}' not found` });
    }
    
    // Create or update the preference
    const preference = await createGroupPreference(
      groupId,
      preferenceType.id,
      value
    );
    
    res.json(preference);
  } catch (error) {
    console.error('Error creating group preference:', error);
    res.status(500).json({ error: `Failed to create preference: ${error.message}` });
  }
});

/**
 * @route POST /api/preferences/site
 * @description Create or update a site preference
 * @access Private (super admin only)
 */
router.post('/site', requireAuth, async (req, res) => {
  try {
    const { preferenceName, value } = req.body;
    
    if (!preferenceName || !value) {
      return res.status(400).json({ error: 'Preference name and value are required' });
    }
    
    // TODO: Check if user is a super admin
    
    // Get the preference type ID
    const preferenceType = await getPreferenceTypeByName(preferenceName);
    if (!preferenceType) {
      return res.status(404).json({ error: `Preference type '${preferenceName}' not found` });
    }
    
    // Create or update the preference
    const preference = await createSitePreference(
      preferenceType.id,
      value
    );
    
    res.json(preference);
  } catch (error) {
    console.error('Error creating site preference:', error);
    res.status(500).json({ error: `Failed to create preference: ${error.message}` });
  }
});

export default router;