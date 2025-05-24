import express from 'express';
import { getClientSchemaLLMConfig, updateClientSchemaLLMConfig } from '../../db/llm/index.js';

const router = express.Router();

/**
 * @route   GET /api/client-schemas/:clientSchemaId/llm-config
 * @desc    Get the LLM configuration for a client schema
 * @access  Private
 */
router.get('/:clientSchemaId/llm-config', async (req, res) => {
  let client;
  try {
    const { clientSchemaId } = req.params;
    console.log('Fetching LLM config for client schema:', clientSchemaId);
    
    if (!clientSchemaId) {
      console.error('Client schema ID is required');
      return res.status(400).json({ error: 'Client schema ID is required' });
    }

    // Check if we have a client pool
    if (!req.clientPool) {
      console.error('No database connection pool available');
      return res.status(500).json({ error: 'Database connection not available' });
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
      return res.status(404).json({ error: 'LLM configuration not found for this client schema' });
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
    
    res.status(500).json({ 
      error: 'Failed to get LLM configuration',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
    }
  }
});

/**
 * @route   PUT /api/client-schemas/:clientSchemaId/llm-config
 * @desc    Update the LLM configuration for a client schema
 * @access  Private
 */
router.put('/:clientSchemaId/llm-config', async (req, res) => {
  try {
    const { clientSchemaId } = req.params;
    const { llmId } = req.body;
    
    if (!clientSchemaId) {
      return res.status(400).json({ error: 'Client schema ID is required' });
    }
    
    if (!llmId) {
      return res.status(400).json({ error: 'LLM ID is required' });
    }

    const updatedConfig = await updateClientSchemaLLMConfig(
      clientSchemaId, 
      llmId, 
      req.clientPool
    );
    
    res.json(updatedConfig);
  } catch (error) {
    console.error('Error updating LLM config:', error);
    res.status(500).json({ error: 'Failed to update LLM configuration' });
  }
});

export default router;
