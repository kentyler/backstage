/**
 * API route for retrieving LLM configurations
 * @module routes/api/llmConfig/configRetrieval
 */

import express from 'express';
import { getClientLLMConfig } from '../../../db/llm/index.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   GET /api/llm-config
 * @desc    Get the LLM configuration for the current client
 * @access  Private
 */
router.get('/llm-config', async (req, res, next) => {
  let client;
  try {
    const clientId = req.session?.client_id;
    console.log('Fetching LLM config for client:', clientId);
    
    if (!clientId) {
      console.error('Client ID not found in session');
      return next(new ApiError('Client ID not found in session. Please log in first.', 401));
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
    console.log('Calling getClientLLMConfig');
    const config = await getClientLLMConfig(clientId, req.clientPool);
    
    if (!config) {
      console.error('No LLM config found for client:', clientId);
      return next(new ApiError('LLM configuration not found for this client', 404));
    }

    console.log('Successfully retrieved LLM config for client:', clientId);
    res.json(config);
  } catch (error) {
    console.error('Error in GET /api/llm-config:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail,
      query: error.query,
      where: error.where,
      schema: req.session?.schema,
      clientId: req.session?.client_id,
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
      clientId: req?.session?.client_id,
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
