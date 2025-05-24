import Anthropic from '@anthropic-ai/sdk';

/**
 * Sends a prompt to Anthropic API and returns the response
 * @param {string} prompt - The user prompt to send to Anthropic
 * @param {string} apiKey - The Anthropic API key
 * @param {string} model - The model to use (e.g. 'claude-3-opus-20240229')
 * @param {number} maxTokens - Maximum tokens to generate, defaults to 1000
 * @returns {Promise<string>} - The text response from Anthropic
 */
export async function sendPromptToAnthropic(prompt, apiKey, model, maxTokens = 1000) {
  if (!apiKey) {
    throw new Error('Anthropic API key is missing in the configuration');
  }

  const anthropic = new Anthropic({
    apiKey: apiKey
  });
  
  console.log('Sending prompt to Anthropic:', prompt);
  const msg = await anthropic.messages.create({
    model: model,
    max_tokens: maxTokens,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });
  
  console.log('Received response from Anthropic');
  return msg.content[0].text;
}
