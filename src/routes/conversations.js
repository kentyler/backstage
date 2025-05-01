/**
 * @file src/routes/conversations.js
 * @description Routes for handling conversations between participants and LLMs
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getParticipantById, updateParticipant } from '../db/participants/index.js';
import { createGrpConAvatarTurn } from '../db/grpConAvatarTurns/index.js';
import { getGrpConAvatarTurnsByConversation } from '../db/grpConAvatarTurns/index.js';
import { CLAUDE_PARTICIPANT_ID, CLAUDE_AVATAR_ID, getClaudeResponse } from '../services/claudeService.js';
import { generateEmbedding, findSimilarTexts, findRelevantContext } from '../services/embeddingService.js';

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
    
    // Get the participant to access their avatar ID and name
    const participant = await getParticipantById(participantId);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    // Format the prompt with the participant's name as a prefix
    const formattedPrompt = `<${participant.name}>:${prompt}`;
    
    // Get the current avatar ID for the participant
    let participantAvatarId = participant.current_avatar_id;
    
    // If participant doesn't have a current avatar ID, set a default one
    if (!participantAvatarId) {
      console.log(`Participant ${participantId} doesn't have a current avatar ID. Setting default avatar ID ${CLAUDE_AVATAR_ID}.`);
      
      try {
        // Update the participant with the default avatar ID
        const updatedParticipant = await updateParticipant(participantId, { current_avatar_id: CLAUDE_AVATAR_ID });
        
        if (updatedParticipant) {
          participantAvatarId = CLAUDE_AVATAR_ID;
          console.log(`Successfully updated participant ${participantId} with default avatar ID ${CLAUDE_AVATAR_ID}.`);
        } else {
          console.error(`Failed to update participant ${participantId} with default avatar ID.`);
          return res.status(500).json({ error: 'Failed to set default avatar for participant' });
        }
      } catch (error) {
        console.error(`Error setting default avatar for participant ${participantId}:`, error);
        return res.status(500).json({ error: 'Failed to set default avatar for participant' });
      }
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
        role: turn.avatar_id === CLAUDE_AVATAR_ID ? 'assistant' : 'user',
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
      const MAX_CONTEXT_LENGTH = 100000; // Characters (well within Claude's context window)
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
    
    // Get response from Claude API
    let llmResponse;
    try {
      // Construct the enhanced prompt with memory context
      let systemMessage = "You are a helpful AI assistant. Respond concisely and clearly.";
      
      if (conversationHistory.length > 0) {
        // Create a more explicit system message for broader context usage
        systemMessage = `You have access to the conversation history between you and the user. 
This history contains important information that the user has shared with you previously.
Use this history to provide more personalized and relevant responses to the user's current prompt.
DO NOT say you don't have access to previous conversations or that you don't remember - you have the relevant history below.

IMPORTANT GUIDELINES:
1. Consider past information for ALL prompts when it's relevant to the current context.
2. Use the user's previously shared preferences, facts, and details to personalize your responses.
3. When referencing past information, be accurate and precise about what the user actually said.
4. Keep your responses focused on the current prompt - only include past information that is directly relevant.
5. If the user asks about something they haven't mentioned before, respond naturally without drawing attention to the lack of history.`;
        
        // Format the messages for Claude in a way that preserves the conversation flow
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
        
        // Get response from Claude API with the full message history
        console.log(`Getting Claude response with ${messages.length} messages in history`);
        llmResponse = await getClaudeResponse(formattedPrompt, {
          systemMessage,
          messages
        });
      } else {
        // No relevant context, just use the formatted prompt directly
        console.log(`Getting Claude response for prompt without context`);
        llmResponse = await getClaudeResponse(formattedPrompt);
      }
      
      console.log(`Successfully received Claude response (${llmResponse.length} chars)`);
    } catch (error) {
      console.error('Error getting Claude response:', error);
      
      // Check if Claude service is initialized
      if (error.message.includes('not initialized')) {
        return res.status(500).json({ 
          error: 'Claude service not initialized. Please check API key configuration.' 
        });
      }
      
      // Return the error to the client instead of using a mock response
      return res.status(500).json({ 
        error: `Failed to get response from Claude: ${error.message}` 
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
    const llmTurn = await createGrpConAvatarTurn(
      conversationId,
      CLAUDE_AVATAR_ID,
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