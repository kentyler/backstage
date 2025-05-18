import express from 'express';
import { getClientSchemaLLMConfig, updateClientSchemaLLMConfig } from '../../db/llmConfig.js';
import { pool } from '../../db/connection.js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Simple function to store a message
async function storeMessage(topicPathId, avatarId, content, isUser = true) {
  try {
    console.log('Storing message with:', { topicPathId, avatarId, contentLength: content?.length, isUser });
    
    // First, check if we need to create a new conversation
    const result = await pool.query(
      `INSERT INTO dev.grp_con_avatar_turns 
       (topicpathid, avatar_id, content_text, message_type_id, turn_kind_id, turn_index)
       VALUES ($1, $2, $3, $4, $5, 
              COALESCE((SELECT MAX(turn_index) + 1 FROM dev.grp_con_avatar_turns WHERE topicpathid = $1), 1))
       RETURNING id`,
      [
        topicPathId, 
        avatarId, 
        content, 
        isUser ? 1 : 2, // message_type_id
        isUser ? 1 : 2  // turn_kind_id (1 for user, 2 for assistant)
      ]
    );
    
    console.log('Message stored successfully with ID:', result.rows[0]?.id);
    return result.rows[0]?.id;
  } catch (error) {
    console.error('Error storing message:', {
      error: error.message,
      stack: error.stack,
      query: 'INSERT INTO dev.grp_con_avatar_turns (topicpathid, avatar_id, content_text, message_type_id, turn_index) VALUES ($1, $2, $3, $4, ...)'
    });
    // Don't fail the request if storage fails
    return null;
  }
}

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

/**
 * @route   POST /api/llm/prompt
 * @desc    Submit a prompt to the LLM and get a response
 * @access  Private
 */
/**
 * @route   POST /api/llm/prompt
 * @desc    Process a prompt and return a response, storing the conversation
 * @access  Private
 */
router.post('/prompt', async (req, res) => {
  let client;
  try {
    let { prompt, topicPathId, avatarId, clientSchemaId } = req.body;
    
    // Validate required fields
    if (!topicPathId) {
      return res.status(400).json({ error: 'topicPathId is required' });
    }
    
    if (!avatarId) {
      return res.status(400).json({ error: 'avatarId is required' });
    }
    
    // Convert topicPathId to string and trim
    topicPathId = String(topicPathId).trim();
    
    // Convert other IDs to numbers
    avatarId = Number(avatarId);
    clientSchemaId = Number(clientSchemaId);
    
    if (isNaN(avatarId)) {
      return res.status(400).json({ error: 'avatarId must be a valid number' });
    }
    
    if (isNaN(avatarId)) {
      return res.status(400).json({ error: 'avatarId must be a valid number' });
    }
    
    if (isNaN(clientSchemaId)) {
      return res.status(400).json({ error: 'clientSchemaId must be a valid number' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!clientSchemaId) {
      return res.status(400).json({ error: 'Client schema ID is required' });
    }

    // Get a client from the pool
    client = await req.clientPool.connect();

    // Get the LLM config first
    console.log('Fetching LLM config for client schema:', clientSchemaId);
    const config = await getClientSchemaLLMConfig(clientSchemaId, req.clientPool);
    
    if (!config) {
      console.error('No LLM configuration found for client schema:', clientSchemaId);
      return res.status(404).json({ 
        error: 'LLM configuration not found',
        details: `No configuration found for client schema ${clientSchemaId}`
      });
    }
    
    // Store the user's message with the topic path
    console.log('Storing user message...');
    const userMessageId = await storeMessage(topicPathId, avatarId, prompt, true);
    console.log('User message stored with ID:', userMessageId);
    
    console.log('Retrieved LLM config:', {
      provider: config.provider,
      model: config.model,
      hasApiKey: !!config.api_key,
      type: config.type_name
    });
    
    if (!config.api_key) {
      console.error('API key is missing from the LLM configuration');
      return res.status(500).json({ 
        error: 'Configuration error',
        details: 'API key is missing from the LLM configuration'
      });
    }

    let response;
    
    if (config.provider === 'anthropic') {
      console.log('Initializing Anthropic client with config:', {
        hasApiKey: !!config.api_key,
        model: config.model
      });
      
      if (!config.api_key) {
        throw new Error('Anthropic API key is missing in the configuration');
      }
      
      const anthropic = new Anthropic({
        apiKey: config.api_key
      });
      
      console.log('Sending prompt to Anthropic:', prompt);
      const msg = await anthropic.messages.create({
        model: config.model,
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });
      
      console.log('Received response from Anthropic');
      response = msg.content[0].text;
      
      // Store the assistant's response
      console.log('Storing assistant response...');
      const assistantMessageId = await storeMessage(topicPathId, avatarId, response, false);
      console.log('Assistant response stored with ID:', assistantMessageId);
    } else if (config.provider === 'openai') {
      const openai = new OpenAI({
        apiKey: config.apiKey
      });
      
      const completion = await openai.chat.completions.create({
        model: config.model,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });
      
      response = completion.choices[0].message.content;
      
      // Store the assistant's response for OpenAI
      console.log('Storing assistant response (OpenAI)...');
      const assistantMessageId = await storeMessage(topicPathId, avatarId, response, false);
      console.log('Assistant response (OpenAI) stored with ID:', assistantMessageId);
    } else {
      return res.status(400).json({ error: 'Unsupported LLM provider' });
    }
    
    // Store the assistant's response
    const assistantMessageId = await storeMessage(topicPathId, avatarId, response, false);

    // Format response to match frontend expectations
    res.json({ 
      text: response, // The frontend expects a 'text' property
      topicPathId,
      turnIndex: 0, // TODO: Track turn index if needed
      messageId: assistantMessageId
    });
  } catch (error) {
    console.error('Error in POST /api/llm/prompt:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });

    res.status(500).json({
      error: 'Failed to process prompt',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

export default router;
