/**
 * API route for updating LLM configurations
 * @module routes/api/llmConfig/configUpdate
 */

import express from 'express';
import { updateClientSchemaLLMConfig } from '../../../db/llm/index.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   PUT /api/client-schemas/:clientSchemaId/llm-config
 * @desc    Update the LLM configuration for a client schema
 * @access  Private
 */
router.put('/:clientSchemaId/llm-config', async (req, res, next) => {
  try {
    const { clientSchemaId } = req.params;
    const { llmId } = req.body;
    
    if (!clientSchemaId) {
      return next(new ApiError('Client schema ID is required', 400));
    }
    
    if (!llmId) {
      return next(new ApiError('LLM ID is required', 400));
    }

    // Check if we have a client pool
    if (!req.clientPool) {
      console.error('No database connection pool available');
      return next(new ApiError('Database connection not available', 500));
    }

    const updatedConfig = await updateClientSchemaLLMConfig(
      clientSchemaId, 
      llmId, 
      req.clientPool
    );
    
    if (!updatedConfig) {
      return next(new ApiError('Failed to update LLM configuration', 404));
    }
    
    res.json(updatedConfig);
  } catch (error) {
    console.error('Error updating LLM config:', error);
    return next(new ApiError('Failed to update LLM configuration', 500, { 
      cause: error,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }));
  }
});

export default router;
