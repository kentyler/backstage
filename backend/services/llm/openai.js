import OpenAI from 'openai';

/**
 * Sends a prompt to OpenAI API and returns the response
 * @param {string} prompt - The user prompt to send to OpenAI
 * @param {string} apiKey - The OpenAI API key
 * @param {string} model - The model to use (e.g. 'gpt-4')
 * @returns {Promise<string>} - The text response from OpenAI
 */
export async function sendPromptToOpenAI(prompt, apiKey, model) {
  if (!apiKey) {
    throw new Error('OpenAI API key is missing in the configuration');
  }

  const openai = new OpenAI({
    apiKey: apiKey
  });
  
  console.log('Sending prompt to OpenAI:', prompt);
  const completion = await openai.chat.completions.create({
    model: model,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });
  
  console.log('Received response from OpenAI');
  return completion.choices[0].message.content;
}
