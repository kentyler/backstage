/**
 * @file src/services/claudeService.js
 * @description Service for interacting with Claude AI via Anthropic API
 */

import Anthropic from '@anthropic-ai/sdk';

// Constants for Claude configuration
export const CLAUDE_PARTICIPANT_ID = 999; // Hardcoded ID for Claude participant
export const CLAUDE_AVATAR_ID = 888; // Hardcoded ID for Claude avatar

// Initialize the Anthropic client
let anthropic = null;

/**
 * Initialize the Claude service with the API key
 * This should be called when the application starts
 */
export function initClaudeService() {
  const apiKey = process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    console.error('CLAUDE_API_KEY is not set in environment variables');
    return false;
  }
  
  try {
    anthropic = new Anthropic({
      apiKey: apiKey,
    });
    return true;
  } catch (error) {
    console.error('Failed to initialize Claude service:', error);
    return false;
  }
}

/**
 * Get a response from Claude for the given prompt
 * 
 * @param {string} prompt - The user's message
 * @param {Object} options - Optional parameters
 * @param {string} options.systemMessage - Custom system message (optional)
 * @param {Array<{role: string, content: string}>} options.messages - Array of message objects for conversation history (optional)
 * @returns {Promise<string>} Claude's response
 */
export async function getClaudeResponse(prompt, options = {}) {
  if (!anthropic) {
    throw new Error('Claude service not initialized');
  }
  
  // Default system message
  let systemMessage = "You are a helpful AI assistant. Respond concisely and clearly.";
  
  // Override with custom system message if provided
  if (options.systemMessage) {
    systemMessage = options.systemMessage;
  }
  
  try {
    // Use provided messages array if available, otherwise create a simple one with just the prompt
    let messages = options.messages || [{ role: "user", content: prompt }];
    
    // If messages array doesn't include the current prompt, add it
    if (options.messages && !options.messages.some(m => m.role === 'user' && m.content === prompt)) {
      messages.push({ role: "user", content: prompt });
    }
    
    // Log the conversation being sent to Claude
    console.log(`Sending ${messages.length} messages to Claude with system message: "${systemMessage.substring(0, 50)}..."`);
    
    const message = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      messages: messages,
      system: systemMessage
    });
    
    // Log the response for debugging
    console.log(`Claude responded with ${message.content[0].text.length} characters`);
    
    return message.content[0].text;
  } catch (error) {
    console.error('Error getting response from Claude:', error);
    throw new Error(`Failed to get response from Claude: ${error.message}`);
  }
}