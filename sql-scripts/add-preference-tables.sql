-- Create preference_types table (shared across all levels)
CREATE TABLE public.preference_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    default_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add comment explaining the table
COMMENT ON TABLE public.preference_types IS 'Defines types of preferences that can be set at participant, group, or site level';
COMMENT ON COLUMN public.preference_types.name IS 'Unique identifier for the preference type';
COMMENT ON COLUMN public.preference_types.description IS 'Human-readable description of what this preference controls';
COMMENT ON COLUMN public.preference_types.default_value IS 'Default JSON value to use if no preference is explicitly set';

-- Create participant_preferences table
CREATE TABLE public.participant_preferences (
    id SERIAL PRIMARY KEY,
    participant_id BIGINT NOT NULL,
    preference_type_id INTEGER NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_participant_preferences_participant
        FOREIGN KEY (participant_id)
        REFERENCES public.participants(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_participant_preferences_type
        FOREIGN KEY (preference_type_id)
        REFERENCES public.preference_types(id)
        ON DELETE CASCADE,
    CONSTRAINT unique_participant_preference
        UNIQUE (participant_id, preference_type_id)
);

-- Add comment explaining the table
COMMENT ON TABLE public.participant_preferences IS 'Stores preferences set at the participant level';

-- Create group_preferences table
CREATE TABLE public.group_preferences (
    id SERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL,
    preference_type_id INTEGER NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_group_preferences_group
        FOREIGN KEY (group_id)
        REFERENCES public.groups(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_group_preferences_type
        FOREIGN KEY (preference_type_id)
        REFERENCES public.preference_types(id)
        ON DELETE CASCADE,
    CONSTRAINT unique_group_preference
        UNIQUE (group_id, preference_type_id)
);

-- Add comment explaining the table
COMMENT ON TABLE public.group_preferences IS 'Stores preferences set at the group level';

-- Create site_preferences table
CREATE TABLE public.site_preferences (
    id SERIAL PRIMARY KEY,
    preference_type_id INTEGER NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_site_preferences_type
        FOREIGN KEY (preference_type_id)
        REFERENCES public.preference_types(id)
        ON DELETE CASCADE,
    CONSTRAINT unique_site_preference
        UNIQUE (preference_type_id)
);

-- Add comment explaining the table
COMMENT ON TABLE public.site_preferences IS 'Stores preferences set at the site level (global defaults)';

-- Insert default preference type for LLM selection
INSERT INTO public.preference_types (name, description, default_value)
VALUES (
    'llm_selection',
    'Controls which LLM is used for generating responses',
    '{"llm_id": 1}'::jsonb
);

-- Insert default site preference for LLM selection
INSERT INTO public.site_preferences (preference_type_id, value)
VALUES (
    (SELECT id FROM public.preference_types WHERE name = 'llm_selection'),
    '{"llm_id": 1}'::jsonb
);