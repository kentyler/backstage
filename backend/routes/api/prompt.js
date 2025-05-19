import express from 'express';
import { Configuration, OpenAIApi } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth } from '../../middleware/auth.js';

const router = express.Router();

/**
 * Submit a prompt to the LLM
 * POST /api/prompts
 * Body: { prompt: string }
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get the cached LLM config from the session
    const config = req.app.locals.llmConfig;
    if (!config) {
      return res.status(500).json({ error: 'LLM configuration not initialized' });
    }

    let response;
    if (config.provider === 'openai') {
      const openai = new OpenAIApi(new Configuration({
        apiKey: process.env.OPENAI_API_KEY
      }));
      
      const completion = await openai.createChatCompletion({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature,
        max_tokens: config.max_tokens
      });

      response = {
        text: completion.data.choices[0].message.content
      };
    } 
    else if (config.provider === 'anthropic') {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });

      const message = await anthropic.messages.create({
        model: config.model,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        messages: [{ role: 'user', content: prompt }]
      });

      response = {
        text: message.content[0].text
      };
    }
    else {
      throw new Error(`Unsupported provider: ${config.provider}`);
    }

    // Log the response before sending it back to the client
    console.log('LLM Response:', {
      model: config.model,
      provider: config.provider,
      responseLength: response.text.length,
      first100Chars: response.text.substring(0, 100) + (response.text.length > 100 ? '...' : '')
    });
    
    res.json(response);
  } catch (error) {
    console.error('Error in prompt submission:', error);
    res.status(500).json({
      error: 'Failed to process prompt',
      details: error.message
    });
  }
});

export default router;
