-- Add a JSON field to the avatars table for LLM configuration
-- This will store API keys, model names, and other settings specific to different LLM services
ALTER TABLE public.avatars
ADD COLUMN llm_config JSONB;

-- Add a comment to explain the purpose of the field
COMMENT ON COLUMN public.avatars.llm_config IS 'JSON configuration for LLM services, including API keys, model names, and other settings';

-- Example of how to update an avatar with LLM configuration
-- UPDATE public.avatars
-- SET llm_config = '{"api_key": "your-api-key", "model": "claude-3-opus-20240229", "provider": "anthropic"}'::jsonb
-- WHERE id = 3;