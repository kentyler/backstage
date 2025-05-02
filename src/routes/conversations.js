/**
 * @file src/routes/conversations.js
 * @description Routes for handling conversations between participants and LLMs
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getParticipantById, updateParticipant } from '../db/participants/index.js';
import { createGrpConAvatarTurn } from '../db/grpConAvatarTurns/index.js';
import { getGrpConAvatarTurnsByConversation } from '../db/grpConAvatarTurns/index.js';
import { getLLMResponse, getLLMName, getLLMConfig, getLLMId, getDefaultLLMConfig } from '../services/llmService.js';
import { generateEmbedding, findSimilarTexts, findRelevantContext } from '../services/embeddingService.js';
import { getGrpConById } from '../db/grpCons/index.js';
import { getGroupById } from '../db/groups/index.js';

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
    const conversation = await getGrpConById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Get the group to access its LLM avatar ID
    const group = await getGroupById(conversation.group_id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Get the LLM ID and configuration using the preference cascade
    let llmId;
    let llmConfig;
    try {
      // Get the LLM ID using the preference cascade (participant > group > site)
      llmId = await getLLMId(participantId, conversation.group_id);
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
      // Pass the participant ID and group ID to get the correct LLM name based on preferences
      llmName = await getLLMName(participantId, conversation.group_id);
    } catch (error) {
      console.error('Error getting LLM name:', error);
      llmName = 'Anthropic Claude-3-Opus'; // Fallback to hardcoded name if preference lookup fails
    }
    
    // Get the participant to access their avatar ID and name
    const participant = await getParticipantById(participantId);
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
      const avatarPreference = await getPreferenceWithFallback('avatar_id', {
        participantId: participantId,
        groupId: conversation.group_id
      });
      
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
      promptEmbedding = await generateEmbedding(formattedPrompt);
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
      promptEmbedding
    );
    
    // Create an embedding database from existing turns, filtering out turns with invalid embeddings
    const embeddingDatabase = existingTurns
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
    
    console.log(`Created embedding database with ${embeddingDatabase.length} valid turns out of ${existingTurns.length} total turns`);
    
    // Include all past turns as context, but measure total length and limit if needed
    let conversationHistory = [];
    if (embeddingDatabase.length > 0) {
      console.log('Including past turns as conversation history...');
      
      // Convert the embedding database to a conversation history
      // Sort by turn index to maintain conversation flow
      const sortedTurns = embeddingDatabase
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
      
      if (conversationHistory.length > 0) {
        // Create a more explicit system message for broader context usage with anti-hallucination instructions
        systemMessage = `You have access to the conversation history between you and the user. 
This history contains important information that the user has shared with you previously.
Use this history to provide more personalized and relevant responses to the user's current prompt.
DO NOT say you don't have access to previous conversations or that you don't remember - you have the relevant history below.

IMPORTANT GUIDELINES:
1. Consider past information for ALL prompts when it's relevant to the current context.
2. Use the user's previously shared preferences, facts, and details to personalize your responses.
3. When referencing past information, be accurate and precise about what the user actually said.
4. Keep your responses focused on the current prompt - only include past information that is directly relevant.
5. If the user asks about something they haven't mentioned before, respond naturally without drawing attention to the lack of history.
6. NEVER make up or hallucinate information that isn't supported by the conversation context.
7. If you don't know something or it wasn't mentioned in the conversation, acknowledge that rather than making up an answer.
8. Do not introduce new topics, facts, or questions that aren't directly related to what has been discussed.`;
        
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
        console.log(`Getting LLM response with ${messages.length} messages in history`);
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
      responseEmbedding = await generateEmbedding(llmResponse);
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
      responseEmbedding
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
    const turns = await getGrpConAvatarTurnsByConversation(conversationId);
    
    res.json(turns);
  } catch (error) {
    console.error('Error getting conversation turns:', error);
    res.status(500).json({ error: 'Failed to get conversation turns' });
  }
});

export default router;