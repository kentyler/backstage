/**
 * @file src/routes/conversations.js
 * @description Routes for handling conversations between participants and LLMs
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getParticipantById, updateParticipant } from '../db/participants/index.js';
import { createGrpConAvatarTurn } from '../db/grpConAvatarTurns/index.js';
import { TURN_KIND } from '../db/grpConAvatarTurns/createGrpConAvatarTurn.js';
import { getGrpConAvatarTurnsByConversation } from '../db/grpConAvatarTurns/index.js';
import { getLLMResponse, getLLMName, getLLMConfig, getLLMId, getDefaultLLMConfig } from '../services/llmService.js';
import { generateEmbedding, findSimilarTexts, findRelevantContext, initEmbeddingService } from '../services/embeddingService.js';
import { getGrpConById } from '../db/grpCons/index.js';
import { getGroupById } from '../db/groups/index.js';
import { getGrpConUploadsByConversation } from '../db/grpConUploads/index.js';
import { getGrpConUploadVectorsByUpload } from '../db/grpConUploadVectors/index.js';

const router = express.Router();

/**
 * POST /api/conversations/:conversationId/turns
 * 
 * Creates a new turn in a conversation and generates an LLM response
 * Requires authentication
 */
router.post('/:conversationId/turns', requireAuth, async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const { prompt } = req.body;
    const participantId = req.user.participantId;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Get the conversation and its associated group to get the LLM avatar ID
    const conversation = await getGrpConById(conversationId, req.clientPool);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Get the group to access its LLM avatar ID
    const group = await getGroupById(conversation.group_id, req.clientPool);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Get the LLM ID and configuration using the preference cascade
    let llmId;
    let llmConfig;
    try {
      // Get the LLM ID using the preference cascade (participant > group > site)
      llmId = await getLLMId(participantId, conversation.group_id, null, req.clientPool);
      llmConfig = await getLLMConfig(llmId);
      
      if (!llmConfig) {
        throw new Error(`No configuration found for LLM ID ${llmId}`);
      }
      
      console.log(`Using LLM configuration for LLM ID ${llmId}`);
    } catch (error) {
      console.error('Error getting LLM configuration:', error);
      return res.status(500).json({ error: `Failed to get LLM configuration: ${error.message}` });
    }
    
    // Get the LLM name using the preference system
    let llmName;
    try {
      // Pass the participant ID, group ID to get the correct LLM name based on preferences
      llmName = await getLLMName(participantId, conversation.group_id, null, req.clientPool);
    } catch (error) {
      console.error('Error getting LLM name:', error);
      llmName = 'Anthropic Claude-3-Opus'; // Fallback to hardcoded name if preference lookup fails
    }
    
    // Get the participant to access their avatar ID and name
    const participant = await getParticipantById(participantId, req.clientPool);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    // Format the prompt with the participant's name as a prefix
    const formattedPrompt = `<${participant.name}>:${prompt}`;
    
    // Get the avatar ID for the participant from preferences using the preference cascade
    let participantAvatarId;
    
    try {
      // Use the preference cascade: participant > group > site
      const { getPreferenceWithFallback } = await import('../db/preferences/getPreferenceWithFallback.js');
      const avatarPreference = await getPreferenceWithFallback('avatar_id', participantId, req.clientPool);
      
      participantAvatarId = avatarPreference?.value;
      
      if (!participantAvatarId) {
        // Throw an error if no avatar ID is found in the preference cascade
        throw new Error(`No avatar ID found in preferences for participant ${participantId}, group ${conversation.group_id}, or site.`);
      }
      
      console.log(`Using avatar ID ${participantAvatarId} from ${avatarPreference.source} preference.`);
    } catch (error) {
      console.error(`Error getting avatar ID from preferences:`, error);
      return res.status(500).json({ error: `Failed to get avatar ID: ${error.message}` });
    }
    
    // Get the current turn index for this conversation
    const existingTurns = await getGrpConAvatarTurnsByConversation(conversationId);
    const turnIndex = existingTurns.length;
    
    // Generate embedding for the user's prompt
    let promptEmbedding;
    try {
      console.log('Generating embedding for user prompt...');
      // Initialize the embedding service with the LLM config if not already initialized
      const embeddingInitialized = initEmbeddingService(llmConfig);
      if (!embeddingInitialized) {
        throw new Error('Embedding service initialization failed. Check API key and configuration.');
      }
      promptEmbedding = await generateEmbedding(formattedPrompt, null);
      console.log('Successfully generated embedding for user prompt');
    } catch (error) {
      console.error('Error generating embedding for user prompt:', error);
      promptEmbedding = []; // Fallback to empty vector if embedding generation fails
    }
    
    // Create the participant's turn with the embedding
    const userTurn = await createGrpConAvatarTurn(
      conversationId,
      participantAvatarId,
      turnIndex,
      formattedPrompt,
      promptEmbedding,
      TURN_KIND.REGULAR,
      1, // message_type_id = 1 for user messages
      req.clientPool // Pass the client pool from the request
    );
    
    // Create an embedding database from existing turns, filtering out turns with invalid embeddings
    const turnsEmbeddingDatabase = existingTurns
      .filter(turn => {
        // Check if the turn has valid content and embedding
        const hasValidContent = turn && turn.content && typeof turn.content === 'string';
        const hasValidEmbedding = turn && turn.embedding && Array.isArray(turn.embedding) && turn.embedding.length > 0;
        
        if (!hasValidContent || !hasValidEmbedding) {
          console.warn(`Skipping turn with invalid content or embedding: turn_index=${turn?.turn_index}`);
          return false;
        }
        
        return true;
      })
      .map(turn => ({
        text: turn.content,
        embedding: turn.embedding,
        // Determine role based on the turn's metadata
        // Since we can't rely on comparing avatar_id to llmId anymore,
        // we'll need to use a different mechanism or add a flag to the turn
        role: turn.is_assistant ? 'assistant' : 'user',
        turn_index: turn.turn_index
      }));
    
    console.log(`Created turns embedding database with ${turnsEmbeddingDatabase.length} valid turns out of ${existingTurns.length} total turns`);
    
    // Find relevant past turns using vector similarity
    let relevantTurns = [];
    try {
      console.log('Finding relevant past turns using vector similarity...');
      relevantTurns = await findRelevantContext(prompt, turnsEmbeddingDatabase, {
        config: llmConfig,
        threshold: 0.6, // Adjust threshold for turn relevance
        maxResults: 5 // Limit to most relevant turns
      });
      console.log(`Found ${relevantTurns.length} relevant past turns`);
    } catch (error) {
      console.error('Error finding relevant past turns:', error);
      // Continue with empty relevant turns if there's an error
    }
    
    // Get all uploads for this conversation
    let uploads = [];
    let uploadsEmbeddingDatabase = [];
    
    try {
      console.log('Getting uploads for conversation...');
      uploads = await getGrpConUploadsByConversation(conversationId);
      console.log(`Found ${uploads.length} uploads for conversation`);
      
      // Create an embedding database from uploaded files
      if (uploads.length > 0) {
        // For each upload, get its vectors
        for (const upload of uploads) {
          try {
            const vectors = await getGrpConUploadVectorsByUpload(upload.id);
            console.log(`Found ${vectors.length} vectors for upload ${upload.id}`);
            
            // Add each vector to the database
            for (const vector of vectors) {
              // Parse the vector if it's a string
              let parsedVector = vector.content_vector;
              if (typeof vector.content_vector === 'string') {
                try {
                  // Remove the square brackets and split by comma
                  const vectorString = vector.content_vector.replace(/^\[|\]$/g, '');
                  parsedVector = vectorString.split(',').map(Number);
                } catch (error) {
                  console.error('Error parsing vector string:', error);
                  continue; // Skip this vector
                }
              }
              
              // Add to the embedding database
              uploadsEmbeddingDatabase.push({
                text: vector.content_text,
                embedding: parsedVector,
                uploadId: upload.id,
                fileName: upload.file_name,
                mimeType: upload.mime_type
              });
            }
          } catch (error) {
            console.error(`Error getting vectors for upload ${upload.id}:`, error);
          }
        }
        
        console.log(`Created uploads embedding database with ${uploadsEmbeddingDatabase.length} vectors`);
      }
    } catch (error) {
      console.error('Error getting uploads for conversation:', error);
      // Continue with empty uploads if there's an error
    }
    
    // Find relevant content from uploaded files using vector similarity
    let relevantUploads = [];
    if (uploadsEmbeddingDatabase.length > 0) {
      try {
        console.log('Finding relevant content from uploaded files using vector similarity...');
        relevantUploads = await findRelevantContext(prompt, uploadsEmbeddingDatabase, {
          config: llmConfig,
          
          threshold: 0.6, // Adjust threshold for upload relevance
          maxResults: 5 // Limit to most relevant content chunks
        });
        console.log(`Found ${relevantUploads.length} relevant content chunks from uploaded files`);
      } catch (error) {
        console.error('Error finding relevant content from uploaded files:', error);
        // Continue with empty relevant uploads if there's an error
      }
    }
    
    // Combine relevant turns and uploads into a context string
    let vectorSearchContext = '';
    
    if (relevantTurns.length > 0) {
      vectorSearchContext += '### Relevant conversation history:\n\n';
      relevantTurns.forEach((item, index) => {
        vectorSearchContext += `${index + 1}. ${item.text}\n\n`;
      });
    }
    
    if (relevantUploads.length > 0) {
      vectorSearchContext += '### Relevant information from uploaded files:\n\n';
      relevantUploads.forEach((item, index) => {
        // Find the original upload to get the file name
        const uploadInfo = uploadsEmbeddingDatabase.find(u => u.text === item.text);
        const fileName = uploadInfo ? uploadInfo.fileName : 'Unknown file';
        
        vectorSearchContext += `${index + 1}. From "${fileName}":\n${item.text}\n\n`;
      });
    }
    
    // Include all past turns as context, but measure total length and limit if needed
    let conversationHistory = [];
    if (turnsEmbeddingDatabase.length > 0) {
      console.log('Including past turns as conversation history...');
      
      // Convert the embedding database to a conversation history
      // Sort by turn index to maintain conversation flow
      const sortedTurns = turnsEmbeddingDatabase
        .sort((a, b) => a.turn_index - b.turn_index)
        .map(turn => ({
          role: turn.role,
          content: turn.text,
          turn_index: turn.turn_index
        }));
      
      // Measure the total text length
      const MAX_CONTEXT_LENGTH = 100000; // Characters (well within LLM's context window)
      let totalLength = 0;
      let includedTurns = [];
      
      // Start from the most recent turns and work backwards
      // This ensures we include the most recent context if we need to limit
      for (let i = sortedTurns.length - 1; i >= 0; i--) {
        const turn = sortedTurns[i];
        const turnLength = turn.content ? turn.content.length : 0;
        
        // If adding this turn would exceed the maximum length, stop
        if (totalLength + turnLength > MAX_CONTEXT_LENGTH && includedTurns.length > 0) {
          console.log(`Reached maximum context length (${MAX_CONTEXT_LENGTH} characters) after ${includedTurns.length} turns`);
          break;
        }
        
        // Otherwise, include this turn
        totalLength += turnLength;
        includedTurns.unshift(turn); // Add to the beginning to maintain order
      }
      
      conversationHistory = includedTurns;
      
      console.log(`Including ${conversationHistory.length} turns out of ${sortedTurns.length} total turns (${totalLength} characters)`);
    } else {
      console.log('No past turns to include in conversation history');
    }
    
    // Get response from LLM API
    let llmResponse;
    try {
      // Construct the enhanced prompt with memory context
      let systemMessage = "You are a helpful AI assistant. Respond concisely and clearly.";
      
      if (conversationHistory.length > 0 || vectorSearchContext) {
        // Create a more explicit system message for broader context usage with anti-hallucination instructions
        systemMessage = `You have access to the conversation history between you and the user, as well as relevant information from uploaded files. 
This information contains important context that will help you provide more accurate and relevant responses.
DO NOT say you don't have access to previous conversations or uploaded files - you have the relevant information below.

IMPORTANT GUIDELINES:
1. Consider all provided context when it's relevant to the current prompt.
2. Use the user's previously shared preferences, facts, and details to personalize your responses.
3. When referencing past information or uploaded files, be accurate and precise about what they contain.
4. Keep your responses focused on the current prompt - only include context that is directly relevant.
5. If the user asks about something that isn't in the provided context, respond naturally without drawing attention to the lack of information.
6. NEVER make up or hallucinate information that isn't supported by the provided context.
7. If you don't know something or it wasn't mentioned in the context, acknowledge that rather than making up an answer.
8. Do not introduce new topics, facts, or questions that aren't directly related to what has been discussed.`;
        
        // If we have vector search results, add them to the system message
        if (vectorSearchContext) {
          systemMessage += `\n\nHere is relevant information to help you answer the user's question:\n\n${vectorSearchContext}`;
        }
        
        // Format the messages for LLM in a way that preserves the conversation flow
        const messages = [];
        
        // Add the conversation history as separate messages
        for (const ctx of conversationHistory) {
          messages.push({
            role: ctx.role === 'user' ? 'user' : 'assistant',
            content: ctx.content
          });
        }
        
        // Add the current prompt
        messages.push({
          role: 'user',
          content: formattedPrompt
        });
        
        // Get response from LLM API with the full message history, configuration, and parameters to reduce hallucinations
        console.log(`Getting LLM response with ${messages.length} messages in history and vector search context`);
        llmResponse = await getLLMResponse(formattedPrompt, {
          config: llmConfig,
          systemMessage,
          messages,
          temperature: 0.3, // Lower temperature for more deterministic responses
          topP: 0.7 // Lower top_p to reduce unlikely token selections
        });
      } else {
        // No relevant context, just use the formatted prompt directly with parameters to reduce hallucinations
        console.log(`Getting LLM response for prompt without context`);
        llmResponse = await getLLMResponse(formattedPrompt, {
          config: llmConfig,
          temperature: 0.3, // Lower temperature for more deterministic responses
          topP: 0.7 // Lower top_p to reduce unlikely token selections
        });
      }
      
      // Format the response with the LLM's name as a prefix
      llmResponse = `<${llmName}>:${llmResponse}`;
      
      console.log(`Successfully received and formatted LLM response (${llmResponse.length} chars)`);
    } catch (error) {
      console.error('Error getting LLM response:', error);
      
      // Check if LLM service is initialized
      if (error.message.includes('not initialized')) {
        return res.status(500).json({
          error: 'LLM service not initialized. Please check API key configuration.'
        });
      }
      
      // Return the error to the client instead of using a mock response
      return res.status(500).json({ 
        error: `Failed to get response from LLM: ${error.message}`
      });
    }
    
    // Generate embedding for the LLM's response
    let responseEmbedding;
    try {
      console.log('Generating embedding for LLM response...');
      // Initialize the embedding service with the LLM config if not already initialized
      const embeddingInitialized = initEmbeddingService(llmConfig);
      if (!embeddingInitialized) {
        throw new Error('Embedding service initialization failed. Check API key and configuration.');
      }
      responseEmbedding = await generateEmbedding(llmResponse, null);
      console.log('Successfully generated embedding for LLM response');
    } catch (error) {
      console.error('Error generating embedding for LLM response:', error);
      responseEmbedding = []; // Fallback to empty vector if embedding generation fails
    }
    
    // Create the LLM's turn with the embedding
    // Use the LLM ID as the avatar ID for the LLM's turn
    const llmTurn = await createGrpConAvatarTurn(
      conversationId,
      llmId,
      turnIndex + 1,
      llmResponse,
      responseEmbedding,
      TURN_KIND.REGULAR,
      2, // message_type_id = 2 for LLM messages
      req.clientPool // Pass the client pool from the request
    );
    
    // Return both turns
    res.status(201).json({
      userTurn,
      llmTurn
    });
  } catch (error) {
    console.error('Error creating conversation turn:', error);
    res.status(500).json({ error: 'Failed to create conversation turn' });
  }
});

/**
 * GET /api/conversations/:conversationId/turns
 * 
 * Gets all turns for a conversation
 * Requires authentication
 */
router.get('/:conversationId/turns', requireAuth, async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    
    // Get all turns for this conversation
    const turns = await getGrpConAvatarTurnsByConversation(conversationId, req.clientPool);
    
    res.json(turns);
  } catch (error) {
    console.error('Error getting conversation turns:', error);
    res.status(500).json({ error: 'Failed to get conversation turns' });
  }
});

export default router;