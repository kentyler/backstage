/**
 * API route for retrieving LLM configurations
 * @module routes/api/llmConfig/configRetrieval
 */

import express from 'express';
import { getClientSchemaLLMConfig } from '../../../db/llm/index.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   GET /api/client-schemas/:clientSchemaId/llm-config
 * @desc    Get the LLM configuration for a client schema
 * @access  Private
 */
router.get('/:clientSchemaId/llm-config', async (req, res, next) => {
  let client;
  try {
    const { clientSchemaId } = req.params;
    console.log('Fetching LLM config for client schema:', clientSchemaId);
    
    if (!clientSchemaId) {
      console.error('Client schema ID is required');
      return next(new ApiError('Client schema ID is required', 400));
    }

    // Check if we have a client pool
    if (!req.clientPool) {
      console.error('No database connection pool available');
      return next(new ApiError('Database connection not available', 500));
    }

    // Get a client from the pool
    client = await req.clientPool.connect();
    
    // Test the connection
    await client.query('SELECT 1');
    console.log('Database connection test successful');

    // Get the LLM config
    console.log('Calling getClientSchemaLLMConfig');
    const config = await getClientSchemaLLMConfig(clientSchemaId, req.clientPool);
    
    if (!config) {
      console.error('No LLM config found for client schema:', clientSchemaId);
      return next(new ApiError('LLM configuration not found for this client schema', 404));
    }

    console.log('Successfully retrieved LLM config for client schema:', clientSchemaId);
    res.json(config);
  } catch (error) {
    console.error('Error in GET /api/client-schemas/:clientSchemaId/llm-config:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail,
      query: error.query,
      where: error.where,
      schema: req.session?.schema,
      clientSchemaId: req.params.clientSchemaId,
      hasClientPool: !!req.clientPool,
      hint: error.hint,
      position: error.position,
      internalPosition: error.internalPosition,
      internalQuery: error.internalQuery,
      where: error.where,
      schema: error.schema,
      table: error.table,
      column: error.column,
      dataType: error.dataType,
      constraint: error.constraint,
      file: error.file,
      line: error.line,
      routine: error.routine,
      clientSchemaId: req?.params?.clientSchemaId,
      poolAvailable: !!req?.clientPool
    });
    
    return next(new ApiError('Failed to get LLM configuration', 500, { 
      cause: error,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }));
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
    }
  }
});

export default router;
