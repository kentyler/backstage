-- Update max_tokens in llms table with appropriate values for different models
-- This script updates the max_tokens field to represent the model's context window size

-- Update OpenAI models
UPDATE public.llms SET max_tokens = 8192 WHERE provider = 'openai' AND model = 'gpt-4';
UPDATE public.llms SET max_tokens = 32768 WHERE provider = 'openai' AND model = 'gpt-4-32k';
UPDATE public.llms SET max_tokens = 128000 WHERE provider = 'openai' AND model = 'gpt-4-turbo';
UPDATE public.llms SET max_tokens = 4096 WHERE provider = 'openai' AND model = 'gpt-3.5-turbo';
UPDATE public.llms SET max_tokens = 16384 WHERE provider = 'openai' AND model = 'gpt-3.5-turbo-16k';

-- Update Anthropic models
UPDATE public.llms SET max_tokens = 200000 WHERE provider = 'anthropic' AND model = 'claude-3-opus';
UPDATE public.llms SET max_tokens = 200000 WHERE provider = 'anthropic' AND model = 'claude-3-sonnet';
UPDATE public.llms SET max_tokens = 100000 WHERE provider = 'anthropic' AND model = 'claude-3-haiku';
UPDATE public.llms SET max_tokens = 100000 WHERE provider = 'anthropic' AND model = 'claude-2';
UPDATE public.llms SET max_tokens = 100000 WHERE provider = 'anthropic' AND model = 'claude-instant';

-- Add a comment to the max_tokens column explaining its dual purpose
COMMENT ON COLUMN public.llms.max_tokens IS 'Maximum tokens the model can process (context window size). Used both for limiting response length and for calculating available tokens.';

-- Verify the updates
SELECT id, name, provider, model, max_tokens FROM public.llms ORDER BY provider, model;