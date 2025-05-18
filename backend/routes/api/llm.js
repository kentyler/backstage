import express from 'express';
import { getClientSchemaLLMConfig, updateClientSchemaLLMConfig } from '../../db/llmConfig.js';
import { pool } from '../../db/connection.js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { generateEmbedding } from '../../services/embeddings.js';

/**
 * Stores a message with its vector representation
 * @param {string} topicPathId - The ID of the topic path
 * @param {number} avatarId - The ID of the avatar (user/assistant)
 * @param {string} content - The message content
 * @param {boolean} isUser - Whether the message is from the user
 * @returns {Promise<string|null>} The ID of the stored message or null if failed
 */
async function storeMessage(topicPathId, avatarId, content, isUser = true) {
  if (!topicPathId) throw new Error('topicPathId is required');
  if (!avatarId) throw new Error('avatarId is required');
  if (!content) throw new Error('content is required');
  
  const client = await pool.connect();
  let turnIndex;
  
  try {
    // Get the next turn index
    const indexResult = await client.query(
      'SELECT COALESCE(MAX(turn_index), 0) + 1 as next_index FROM grp_con_avatar_turns WHERE topicpathid = $1',
      [topicPathId]
    );
    turnIndex = indexResult.rows[0].next_index;

    // Only generate embedding for user messages
    let contentVector = null;
    if (isUser) {
      try {
        contentVector = await generateEmbedding(content);
      } catch (error) {
        console.error('Could not generate embedding, storing message without vector:', error.message);
        // Continue without the vector
      }
    }

    // Insert the message
    const query = contentVector
      ? {
          text: `INSERT INTO grp_con_avatar_turns 
                (topicpathid, avatar_id, content_text, content_vector, message_type_id, turn_kind_id, turn_index)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id`,
          values: [topicPathId, avatarId, content, JSON.stringify(contentVector), isUser ? 1 : 2, isUser ? 1 : 2, turnIndex]
        }
      : {
          text: `INSERT INTO grp_con_avatar_turns 
                (topicpathid, avatar_id, content_text, message_type_id, turn_kind_id, turn_index)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id`,
          values: [topicPathId, avatarId, content, isUser ? 1 : 2, isUser ? 1 : 2, turnIndex]
        };

    const result = await client.query(query);
    return result.rows[0].id;
  } catch (error) {
    console.error('Error storing message:', error);
    throw error;
  } finally {
    client.release();
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
    let { prompt, topicPathId, avatarId } = req.body;
    
    // Validate required fields
    if (!topicPathId) {
      return res.status(400).json({ error: 'topicPathId is required' });
    }
    
    if (!avatarId) {
      return res.status(400).json({ error: 'avatarId is required' });
    }
    
    // Convert topicPathId to string and trim
    topicPathId = String(topicPathId).trim();
    
    // Convert avatarId to number
    avatarId = Number(avatarId);
    
    if (isNaN(avatarId)) {
      return res.status(400).json({ error: 'avatarId must be a valid number' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get a client from the pool
    client = await pool.connect();
    
    // Set the schema if needed (assuming 'dev' schema for now)
    await client.query('SET search_path TO dev, public');
    
    // Get the LLM configuration using the default schema ID (1)
    const schemaId = 1; // Default schema ID
    console.log('Fetching LLM config for schema ID:', schemaId);
    const llmConfig = await getClientSchemaLLMConfig(schemaId, pool);
    
    if (!llmConfig) {
      console.error('No LLM configuration found for schema ID:', schemaId);
      return res.status(404).json({ 
        error: 'LLM configuration not found',
        details: `No configuration found for schema ID ${schemaId}`
      });
    }
    
    console.log('Using LLM config:', llmConfig);
    
    // Store the user's message with the topic path
    console.log('Storing user message...');
    const userMessageId = await storeMessage(topicPathId, avatarId, prompt, true);
    console.log('User message stored with ID:', userMessageId);
    
    console.log('Retrieved LLM config:', {
      provider: llmConfig.provider,
      model: llmConfig.model,
      hasApiKey: !!llmConfig.api_key,
      type: llmConfig.type_name
    });
    
    if (!llmConfig.api_key) {
      console.error('API key is missing from the LLM configuration');
      return res.status(500).json({ 
        error: 'Configuration error',
        details: 'API key is missing from the LLM configuration'
      });
    }

    let response;
    
    if (llmConfig.provider === 'anthropic') {
      console.log('Initializing Anthropic client with config:', {
        hasApiKey: !!llmConfig.api_key,
        model: llmConfig.model
      });
      
      if (!llmConfig.api_key) {
        throw new Error('Anthropic API key is missing in the configuration');
      }
      
      const anthropic = new Anthropic({
        apiKey: llmConfig.api_key
      });
      
      console.log('Sending prompt to Anthropic:', prompt);
      const msg = await anthropic.messages.create({
        model: llmConfig.model,
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });
      
      console.log('Received response from Anthropic');
      response = msg.content[0].text;
      
      // Store the assistant's response with embedding
      console.log('Storing assistant response...');
      const assistantMessageId = await storeMessage(topicPathId, avatarId, response, false);
      console.log('Assistant response stored with ID:', assistantMessageId);
      
      // Generate and store embedding for the assistant's response
      try {
        const embedding = await generateEmbedding(response);
        console.log('Generated embedding for assistant response');
        
        // Update the message with the embedding
        await client.query(
          'UPDATE grp_con_avatar_turns SET content_vector = $1 WHERE id = $2',
          [JSON.stringify(embedding), assistantMessageId]
        );
        console.log('Updated assistant response with embedding');
      } catch (embeddingError) {
        console.error('Error generating/updating embedding for assistant response:', embeddingError);
        // Continue without failing the request
      }
      
      // Send success response with the assistant's response
      res.json({ 
        success: true, 
        message: 'Prompt processed successfully',
        response: response,
        timestamp: new Date().toISOString()
      });
    } else if (llmConfig.provider === 'openai') {
      const openai = new OpenAI({
        apiKey: llmConfig.apiKey
      });
      
      const completion = await openai.chat.completions.create({
        model: llmConfig.model,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });
      
      response = completion.choices[0].message.content;
      
      // Store the assistant's response for OpenAI with embedding
      console.log('Storing assistant response (OpenAI)...');
      const assistantMessageId = await storeMessage(topicPathId, avatarId, response, false);
      console.log('Assistant response (OpenAI) stored with ID:', assistantMessageId);
      
      // Generate and store embedding for the assistant's response (OpenAI)
      try {
        const embedding = await generateEmbedding(response);
        console.log('Generated embedding for OpenAI assistant response');
        
        // Update the message with the embedding
        await client.query(
          'UPDATE grp_con_avatar_turns SET content_vector = $1 WHERE id = $2',
          [JSON.stringify(embedding), assistantMessageId]
        );
        console.log('Updated OpenAI assistant response with embedding');
      } catch (embeddingError) {
        console.error('Error generating/updating embedding for OpenAI assistant response:', embeddingError);
        // Continue without failing the request
      }
      
      // Send success response with the assistant's response
      return res.json({ 
        success: true, 
        message: 'Prompt processed successfully',
        response: response,
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'Unsupported LLM provider',
        details: `Provider '${llmConfig.provider}' is not supported`,
        text: '',
        topicPathId,
        turnIndex: 0,
        messageId: null
      });
    }
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
