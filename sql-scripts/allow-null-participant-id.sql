-- Allow null participant_id values in participant_events table
ALTER TABLE public.participant_events
    ALTER COLUMN participant_id DROP NOT NULL;

-- Drop the existing foreign key constraint
ALTER TABLE public.participant_events
    DROP CONSTRAINT participant_events_participant_id_fkey;

-- Add a new foreign key constraint that allows null values
ALTER TABLE public.participant_events
    ADD CONSTRAINT participant_events_participant_id_fkey 
    FOREIGN KEY (participant_id) 
    REFERENCES public.participants(id) 
    ON DELETE CASCADE;

-- Add comment explaining the change
COMMENT ON COLUMN public.participant_events.participant_id IS 'The ID of the participant (can be null for events not associated with a specific participant, e.g., login attempts with non-existent emails)';