import express from 'express';
import { getClientSchemaLLMConfig, updateClientSchemaLLMConfig } from '../../db/llmConfig.js';
import { pool } from '../../db/connection.js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { generateEmbedding } from '../../services/embeddings.js';
import { findSimilarMessages } from '../../db/messageSearch.js';
import { createGrpTopicAvatarTurn, updateTurnVector } from '../../db/grpTopicAvatarTurns/index.js';

/**
 * Stores a message with its vector representation
 * @param {number} topicPathId - The numeric ID of the topic from the topic_paths table
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
      'SELECT COALESCE(MAX(turn_index), 0) + 1 as next_index FROM grp_topic_avatar_turns WHERE topic_id = $1',
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

    // Insert the message using our central function
    let result;
    try {
      const messageTypeId = isUser ? 1 : 2;
      const turnKindId = isUser ? 1 : 2;
      const templateTopicId = null; // This can be updated if needed in the future
      
      const insertResult = await createGrpTopicAvatarTurn(
        topicPathId,
        avatarId,
        turnIndex,
        content,
        contentVector || null, // Handle the case where contentVector is undefined
        turnKindId,
        messageTypeId,
        templateTopicId,
        client // Pass the client to maintain transaction context
      );
      
      // Create a result object matching the expected structure
      result = { rows: [{ id: insertResult.id }] };
    } catch (error) {
      console.error('Error inserting message:', error);
      throw error;
    }
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
    let { prompt, topicPathId, avatarId, currentMessageId } = req.body;
    
    // Convert currentMessageId to number if provided
    if (currentMessageId) {
      currentMessageId = Number(currentMessageId);
      if (isNaN(currentMessageId)) {
        console.warn('Invalid currentMessageId provided:', req.body.currentMessageId);
        currentMessageId = null;
      }
    }
    
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
      // Also search for relevant messages using the same embedding
      let relevantMessages = [];
      try {
        // Generate embedding for the assistant response
        const embedding = await generateEmbedding(response);
        console.log('Generated embedding for assistant response');
        
        // Update the message with the embedding using our abstraction function
        await updateTurnVector(assistantMessageId, embedding, client);
        console.log('Updated assistant response with embedding');
        
        // Now find relevant messages using the embedding we just generated
        console.log('Finding relevant messages for the response...');
        // Pass the current message ID to exclude it from the results
        // We want to include messages from the current topic, just not the current message itself
        relevantMessages = await findSimilarMessages(embedding, topicPathId, 5, assistantMessageId); // Increase limit to 5
        console.log(`Found ${relevantMessages.length} relevant messages`);
        
        if (relevantMessages.length > 0) {
          console.log('First relevant message:', {
            topicId: relevantMessages[0].topicId,
            score: relevantMessages[0].score,
            snippet: relevantMessages[0].content?.substring(0, 50) + '...'
          });
        } else {
          console.log('No relevant messages found. Embedding details:', {
            embeddingType: typeof embedding,
            embeddingIsArray: Array.isArray(embedding),
            embeddingLength: embedding?.length,
            topicId: topicPathId
          });
          
          // Try querying with a very small limit just to check if any messages exist
          console.log('Attempting broader search with no threshold limit...');
          const testMessages = await client.query(
            'SELECT COUNT(*) FROM grp_topic_avatar_turns WHERE content_vector IS NOT NULL AND topic_id != $1',
            [topicPathId]
          );
          console.log('Database has', testMessages.rows[0].count, 'messages with embeddings in other topics');
        }
      } catch (error) {
        console.error('Error in embedding generation or finding relevant messages:', error);
        // Continue without failing the request
      }
      
      // Log the response before sending it back
      console.log('Sending response to client:', {
        responseLength: response?.length || 0,
        relevantMessagesCount: relevantMessages.length,
        preview: response?.substring(0, 100) + (response?.length > 100 ? '...' : '')
      });
      
      // Send success response with the assistant's response in the format expected by the frontend
      res.json({ 
        id: assistantMessageId,
        content: response,
        relevantMessages, // Include the relevant messages in the response
        success: true, 
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
        
        // Update the message with the embedding using our abstraction function
        await updateTurnVector(assistantMessageId, embedding, client);
        console.log('Updated OpenAI assistant response with embedding');
      } catch (embeddingError) {
        console.error('Error generating/updating embedding for OpenAI assistant response:', embeddingError);
        // Continue without failing the request
      }
      
      // Send success response with the assistant's response in the format expected by the frontend
      return res.json({ 
        success: true, 
        id: assistantMessageId,
        content: response,
        timestamp: new Date().toISOString(),
        relevantMessages: relevantMessages
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
