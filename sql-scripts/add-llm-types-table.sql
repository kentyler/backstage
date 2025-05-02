-- Create a lookup table for LLM types
CREATE TABLE public.llm_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    api_handler VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add comment explaining the table
COMMENT ON TABLE public.llm_types IS 'Lookup table for different LLM API types';
COMMENT ON COLUMN public.llm_types.name IS 'Unique name for this LLM type';
COMMENT ON COLUMN public.llm_types.description IS 'Description of this LLM type and its capabilities';
COMMENT ON COLUMN public.llm_types.api_handler IS 'The function or method that handles API calls for this type';

-- Populate with initial values
INSERT INTO public.llm_types (name, description, api_handler) VALUES
('anthropic', 'Anthropic Claude models using the Messages API', 'handleAnthropicRequest'),
('openai', 'OpenAI models using the Chat Completions API', 'handleOpenAIRequest'),
('openai_assistant', 'OpenAI Custom GPTs and Assistants using the Assistants API', 'handleOpenAIAssistantRequest');

-- Add type_id to llms table
ALTER TABLE public.llms
    ADD COLUMN type_id INTEGER;

-- Add foreign key constraint
ALTER TABLE public.llms
    ADD CONSTRAINT llms_type_id_fkey
    FOREIGN KEY (type_id)
    REFERENCES public.llm_types(id);

-- Update existing records
UPDATE public.llms
    SET type_id = (SELECT id FROM public.llm_types WHERE name = provider)
    WHERE provider IS NOT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN public.llms.type_id IS 'The ID of the LLM type (references llm_types.id)';