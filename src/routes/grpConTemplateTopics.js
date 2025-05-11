// src/routes/grpConTemplateTopics.js
import express from 'express';
import * as topicsCtrl from '../db/grpConTemplateTopics/index.js';

const router = express.Router();

/**
 * POST   /api/grp-con-template-topics
 *    body: { template_id, title, content, topic_index }
 */
router.post('/', async (req, res, next) => {
  try {
    const { template_id, title, content, topic_index } = req.body;
   
    const topic = await topicsCtrl.createGrpConTemplateTopic(
      template_id,
      title,
      content,
      topic_index
    );
    res.status(201).json(topic);
  } catch (err) {
    next(err);
  }
});

/**
 * GET    /api/grp-con-template-topics/by-template/:templateId
 */
router.get('/by-template/:templateId', async (req, res, next) => {
  try {
 
    const topics = await topicsCtrl.getGrpConTemplateTopicsByTemplate(
      Number(req.params.templateId)
    );
    res.json(topics);
  } catch (err) {
    next(err);
  }
});

/**
 * GET    /api/grp-con-template-topics/:topicId
 */
router.get('/:topicId', async (req, res, next) => {
  try {
    
    const topic = await topicsCtrl.getGrpConTemplateTopicById(
      Number(req.params.topicId)
    );
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    res.json(topic);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT    /api/grp-con-template-topics/:topicId
 *    body: { title, content, topic_index }
 */
router.put('/:topicId', async (req, res, next) => {
  try {
    const { title, content, topic_index } = req.body;

    const topic = await topicsCtrl.updateGrpConTemplateTopic(
      Number(req.params.topicId),
      title,
      content,
      topic_index
    );
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    res.json(topic);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/grp-con-template-topics/:topicId
 */
router.delete('/:topicId', async (req, res, next) => {
  try {
  
    const topic = await topicsCtrl.deleteGrpConTemplateTopic(
      Number(req.params.topicId)
    );
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    res.json(topic);
  } catch (err) {
    next(err);
  }
});

export default router;