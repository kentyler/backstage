-- Create a new table for LLMs
CREATE TABLE public.llms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    api_key VARCHAR(255),
    temperature FLOAT DEFAULT 0.3,
    max_tokens INTEGER DEFAULT 1000,
    additional_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add comment explaining the table
COMMENT ON TABLE public.llms IS 'Stores LLM configurations including provider, model, and API keys';

-- Add comments explaining the fields
COMMENT ON COLUMN public.llms.name IS 'Human-readable name for this LLM configuration';
COMMENT ON COLUMN public.llms.provider IS 'The LLM provider (e.g., anthropic, openai)';
COMMENT ON COLUMN public.llms.model IS 'The specific model to use (e.g., claude-3-opus-20240229, gpt-4)';
COMMENT ON COLUMN public.llms.api_key IS 'API key for the LLM provider';
COMMENT ON COLUMN public.llms.temperature IS 'Controls randomness (0.0-1.0, lower is more deterministic)';
COMMENT ON COLUMN public.llms.max_tokens IS 'Maximum number of tokens in the response';
COMMENT ON COLUMN public.llms.additional_config IS 'Additional provider-specific configuration options as JSON';

-- Insert default LLM (Claude)
INSERT INTO public.llms (name, provider, model, api_key, temperature, max_tokens, additional_config)
VALUES (
    'Claude',
    'anthropic',
    'claude-3-opus-20240229',
    NULL, -- API key should be set via environment variable or updated later
    0.3,
    1000,
    '{"top_p": 0.7}'::jsonb
);

-- Add llm_id field to participants table
ALTER TABLE public.participants
    ADD COLUMN llm_id INTEGER;

-- Add foreign key constraint to reference llms table
ALTER TABLE public.participants
    ADD CONSTRAINT participants_llm_id_fkey 
    FOREIGN KEY (llm_id) 
    REFERENCES public.llms(id);

-- Set default LLM for existing participants
UPDATE public.participants
    SET llm_id = 1
    WHERE llm_id IS NULL;

-- Add comment explaining the field
COMMENT ON COLUMN public.participants.llm_id IS 'The ID of the LLM configuration to use for this participant (references llms.id)';