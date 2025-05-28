/**
 * API route for processing user messages and generating LLM responses
 * @module routes/api/promptProcessor/messageProcessor
 */

import express from 'express';
import { pool } from '../../../db/connection.js';
import { getClientSchemaLLMConfig } from '../../../db/llm/index.js';
import { sendPromptToOpenAI, sendPromptToAnthropic } from '../../../services/llm/index.js';
import { processUserMessage, processAssistantMessage } from '../../../services/messageProcessor.js';
import { ApiError } from '../../../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/llm/prompt
 * @desc    Process a prompt and return a response, storing the conversation
 * @access  Private
 */
router.post('', async (req, res, next) => {
  let client;
  try {
    const { 
      prompt, 
      topicPathId, 
      avatarId, 
      currentMessageId, 
      isComment, 
      turn_kind_id, 
      turn_index, 
      referenceMessageIndex 
    } = req.body;
    
    // Convert currentMessageId to number if provided
    let processedCurrentMessageId = null;
    if (currentMessageId) {
      processedCurrentMessageId = Number(currentMessageId);
      if (isNaN(processedCurrentMessageId)) {
        console.warn('Invalid currentMessageId provided:', req.body.currentMessageId);
      }
    }
    
    // Validate required fields
    if (!topicPathId) {
      return next(new ApiError('topicPathId is required', 400));
    }
    
    if (!avatarId) {
      return next(new ApiError('avatarId is required', 400));
    }
    
    // Convert topicPathId to string and trim
    const processedTopicPathId = String(topicPathId).trim();
    
    // Convert avatarId to number
    const processedAvatarId = Number(avatarId);
    
    if (isNaN(processedAvatarId)) {
      return next(new ApiError('avatarId must be a valid number', 400));
    }

    if (!prompt) {
      return next(new ApiError('Prompt is required', 400));
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
      return next(new ApiError('LLM configuration not found', 404, {
        details: `No configuration found for schema ID ${schemaId}`
      }));
    }
    
    console.log('Using LLM config:', llmConfig);
    
    // Check for comment handling early - if it's a comment, delegate to the comment processor
    if (isComment) {
      // Comments are handled by the commentProcessor router
      return next();
    }
    
    // Get the user's participant ID from the request body or fall back to session
    const participantId = req.body.participantId || req.session?.userId || null;
    console.log('Using participant ID:', participantId, 'Source:', req.body.participantId ? 'request body' : 'session');
    
    // For normal messages, continue with regular flow
    const userMessageId = await processUserMessage(
      processedTopicPathId, 
      processedAvatarId, 
      prompt, 
      participantId, 
      pool
    );
    
    console.log('Retrieved LLM config:', {
      provider: llmConfig.provider,
      model: llmConfig.model,
      hasApiKey: !!llmConfig.api_key,
      type: llmConfig.type_name
    });
    
    if (!llmConfig.api_key) {
      console.error('API key is missing from the LLM configuration');
      return next(new ApiError('LLM API key is missing', 500));
    }
    
    // Prepare the LLM service and send the prompt
    let llmResponse;
    
    if (llmConfig.provider === 'anthropic') {
      console.log('Using Anthropic service with config:', {
        hasApiKey: !!llmConfig.api_key,
        model: llmConfig.model
      });
      
      llmResponse = await sendPromptToAnthropic(
        prompt,
        llmConfig.model,
        llmConfig.api_key,
        llmConfig.temperature,
        llmConfig.max_tokens
      );
    } else if (llmConfig.provider === 'openai') {
      console.log('Using OpenAI service with config:', {
        hasApiKey: !!llmConfig.api_key,
        model: llmConfig.model
      });
      
      llmResponse = await sendPromptToOpenAI(
        prompt,
        llmConfig.model,
        llmConfig.api_key,
        llmConfig.temperature,
        llmConfig.max_tokens
      );
    } else {
      return next(new ApiError(`Unsupported LLM provider: ${llmConfig.provider}`, 400));
    }
    
    // Process the assistant's response
    const assistantMessageId = await processAssistantMessage(
      processedTopicPathId,
      processedAvatarId,
      llmResponse,
      participantId,
      pool
    );
    
    const response = {
      userMessageId,
      assistantMessageId,
      text: llmResponse,
      model: llmConfig.model,
      provider: llmConfig.provider
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in POST /api/llm/prompt:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    
    return next(new ApiError('Failed to process prompt', 500, {
      cause: error,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }));
  } finally {
    if (client) {
      client.release();
    }
  }
});

export default router;
