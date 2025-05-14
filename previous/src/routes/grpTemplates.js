// src/routes/grpTemplates.js
import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

/**
 * GET /api/grp-templates/by-group/:groupId
 * Fetches all templates belonging to a specific group
 */
router.get('/by-group/:groupId', async (req, res, next) => {
  try {
    const groupId = Number(req.params.groupId);
    
    const query = `
      SELECT id, group_id, name, description, created_at, updated_at, created_by_participant_id
      FROM grp_templates
      WHERE group_id = $1
      ORDER BY name ASC
    `;
    
    const result = await req.clientPool.query(query, [groupId]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/grp-templates/:id
 * Fetches a specific template by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const templateId = Number(req.params.id);
    
    const query = `
      SELECT id, group_id, name, description, created_at, updated_at, created_by_participant_id
      FROM grp_templates
      WHERE id = $1
    `;
    
    const result = await req.clientPool.query(query, [templateId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/grp-templates
 * Creates a new template for a group
 */
router.post('/', async (req, res, next) => {
  try {
    const { group_id, name, description, created_by_participant_id } = req.body;
    
    const query = `
      INSERT INTO grp_templates (group_id, name, description, created_by_participant_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, group_id, name, description, created_at, updated_at, created_by_participant_id
    `;
    
    const result = await req.clientPool.query(query, [
      group_id,
      name,
      description,
      created_by_participant_id
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
