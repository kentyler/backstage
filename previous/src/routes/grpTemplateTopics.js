// src/routes/grpTemplateTopics.js
import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

/**
 * GET /api/grp-template-topics/by-template/:templateId
 * Fetches all topics belonging to a specific template
 */
router.get('/by-template/:templateId', async (req, res, next) => {
  try {
    const templateId = Number(req.params.templateId);
    
    const query = `
      SELECT id, template_id, title, content, topic_index, created_at, updated_at
      FROM grp_template_topics
      WHERE template_id = $1
      ORDER BY topic_index ASC
    `;
    
    const result = await req.clientPool.query(query, [templateId]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/grp-template-topics/:id
 * Fetches a specific topic by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const topicId = Number(req.params.id);
    
    const query = `
      SELECT id, template_id, title, content, topic_index, created_at, updated_at
      FROM grp_template_topics
      WHERE id = $1
    `;
    
    const result = await req.clientPool.query(query, [topicId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/grp-template-topics
 * Creates a new topic for a template
 */
router.post('/', async (req, res, next) => {
  try {
    const { template_id, title, content, topic_index } = req.body;
    
    const query = `
      INSERT INTO grp_template_topics (template_id, title, content, topic_index)
      VALUES ($1, $2, $3, $4)
      RETURNING id, template_id, title, content, topic_index, created_at, updated_at
    `;
    
    const result = await req.clientPool.query(query, [
      template_id,
      title,
      content,
      topic_index
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
