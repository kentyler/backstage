-- Remove columns from participants table
-- This script removes current_avatar_id, current_group_id, and llm_id columns
-- and their associated constraints from the participants table

-- Drop foreign key constraints first
ALTER TABLE public.participants DROP CONSTRAINT IF EXISTS fk_participants_current_avatar;
ALTER TABLE public.participants DROP CONSTRAINT IF EXISTS participants_llm_id_fkey;

-- Drop columns
ALTER TABLE public.participants DROP COLUMN IF EXISTS current_avatar_id;
ALTER TABLE public.participants DROP COLUMN IF EXISTS current_group_id;
ALTER TABLE public.participants DROP COLUMN IF EXISTS llm_id;

-- Log the changes
DO $$
BEGIN
    RAISE NOTICE 'Removed columns current_avatar_id, current_group_id, and llm_id from participants table';
END $$;