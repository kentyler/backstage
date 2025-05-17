/**
 * @file services/llm.js
 * @description Service for interacting with LLM providers
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Initialize clients
let anthropicClient = null;
let openaiClient = null;

/**
 * Initialize the LLM clients with API keys
 */
export function initLLMClients() {
  if (process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }
  
  if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
}

/**
 * Get response from Anthropic Claude
 */
async function getClaudeResponse(prompt, config) {
  if (!anthropicClient) {
    throw new Error('Anthropic client not initialized');
  }

  const response = await anthropicClient.messages.create({
    model: config.model || 'claude-3-opus-20240229',
    max_tokens: config.maxTokens || 1000,
    temperature: config.temperature || 0.7,
    messages: [{ role: 'user', content: prompt }]
  });

  return response.content[0].text;
}

/**
 * Get response from OpenAI
 */
async function getOpenAIResponse(prompt, config) {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized');
  }

  const response = await openaiClient.chat.completions.create({
    model: config.model || 'gpt-4-turbo-preview',
    max_tokens: config.maxTokens || 1000,
    temperature: config.temperature || 0.7,
    messages: [{ role: 'user', content: prompt }]
  });

  return response.choices[0].message.content;
}

/**
 * Get LLM response based on configuration
 */
export async function getLLMResponse(prompt, config) {
  if (!config || !config.provider) {
    throw new Error('LLM configuration required');
  }

  switch (config.provider.toLowerCase()) {
    case 'anthropic':
      return getClaudeResponse(prompt, config);
    case 'openai':
      return getOpenAIResponse(prompt, config);
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}
