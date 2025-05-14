// src/routes/grpConTemplateInstances.js
import express from 'express';
import * as instancesCtrl from '../db/grpConTemplateInstances/index.js';
import { pool } from '../db/connection.js';

const router = express.Router();

/**
 * POST   /api/grp-con-template-instances
 *    body: { template_id, group_id, name, description }
 */
router.post('/', async (req, res, next) => {
  try {
    const { template_id, group_id, name, description } = req.body;
    
    const instance = await instancesCtrl.createGrpConTemplateInstance(
      template_id,
      group_id,
      name,
      description,
      pool
    );
    
    res.status(201).json(instance);
  } catch (error) {
    next(error);
  }
});

/**
 * GET    /api/grp-con-template-instances/by-template/:templateId
 */
router.get('/by-template/:templateId', async (req, res, next) => {
  try {
    const templateId = Number(req.params.templateId);
    const instances = await instancesCtrl.getGrpConTemplateInstancesByTemplate(
      templateId,
      pool
    );
    
    res.json(instances);
  } catch (error) {
    next(error);
  }
});

export default router;
