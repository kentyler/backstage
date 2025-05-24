import express from 'express';
import { pool } from '../../db/connection.js';
import { getClientSchemaLLMConfig } from '../../db/llm/index.js';
import { processComment } from '../../services/comments/index.js';
import { sendPromptToOpenAI, sendPromptToAnthropic } from '../../services/llm/index.js';
import { processUserMessage, processAssistantMessage } from '../../services/messageProcessor.js';

const router = express.Router();

/**
 * @route   POST /api/llm/prompt
 * @desc    Process a prompt and return a response, storing the conversation
 * @access  Private
 */
router.post('', async (req, res) => {
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
    
    // Get the user's participant ID from the request body or fall back to session
    const participantId = req.body.participantId || req.session?.userId || null;
    console.log('Using participant ID:', participantId, 'Source:', req.body.participantId ? 'request body' : 'session');
    
    // Process the message to check if it's a comment
    const commentResult = await processComment(prompt, topicPathId, avatarId, participantId, pool);
    
    // If it's a comment, return the result and don't continue with LLM processing
    if (commentResult) {
      console.log('Processed comment message with ID:', commentResult.id);
      return res.json(commentResult);
    }
    
    // For normal messages, continue with regular flow
    const userMessageId = await processUserMessage(topicPathId, avatarId, prompt, participantId, pool);
    
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
      console.log('Using Anthropic service with config:', {
        hasApiKey: !!llmConfig.api_key,
        model: llmConfig.model
      });
      
      // Use the extracted service function to get response from Anthropic
      response = await sendPromptToAnthropic(prompt, llmConfig.api_key, llmConfig.model);
      
      // Use the LLM config ID as the llm_id
      const llmId = llmConfig.id || null;
      
      // Process the assistant's response with our new service
      const { id: assistantMessageId, relevantMessages } = await processAssistantMessage(
        topicPathId, 
        avatarId, 
        response, 
        llmId, 
        pool, 
        client
      );
      
      // Send success response with the assistant's response in the format expected by the frontend
      res.json({ 
        id: assistantMessageId,
        userMessageId: userMessageId, // Include the user message ID so frontend can properly handle the conversation flow
        content: response,
        relevantMessages, // Include the relevant messages in the response
        success: true, 
        timestamp: new Date().toISOString()
      });
    } else if (llmConfig.provider === 'openai') {
      console.log('Using OpenAI service with config:', {
        hasApiKey: !!llmConfig.apiKey,
        model: llmConfig.model
      });
      
      // Use the extracted service function to get response from OpenAI
      response = await sendPromptToOpenAI(prompt, llmConfig.apiKey, llmConfig.model);
      
      // Use the LLM config ID as the llm_id
      const llmId = llmConfig.id || null;
      
      // Process the assistant's response with our new service
      const { id: assistantMessageId, relevantMessages } = await processAssistantMessage(
        topicPathId, 
        avatarId, 
        response, 
        llmId, 
        pool, 
        client
      );
      
      // Send success response with the assistant's response in the format expected by the frontend
      return res.json({ 
        success: true, 
        id: assistantMessageId,
        userMessageId: userMessageId, // Include the user message ID so frontend can properly handle the conversation flow
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
