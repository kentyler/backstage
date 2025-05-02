-- Add LLM_avatar_id field to groups table
ALTER TABLE public.groups
    ADD COLUMN llm_avatar_id INTEGER;

-- Add foreign key constraint to reference avatars table
ALTER TABLE public.groups
    ADD CONSTRAINT groups_llm_avatar_id_fkey 
    FOREIGN KEY (llm_avatar_id) 
    REFERENCES public.avatars(id);

-- Set default value for existing groups to use Claude's avatar ID (3)
UPDATE public.groups
    SET llm_avatar_id = 3
    WHERE llm_avatar_id IS NULL;

-- Add comment explaining the field
COMMENT ON COLUMN public.groups.llm_avatar_id IS 'The ID of the avatar to use as the LLM for this group (references avatars.id)';