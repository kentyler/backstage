-- Check if the sequence exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'participant_events_id_seq') THEN
        CREATE SEQUENCE public.participant_events_id_seq
            AS integer
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1;
    END IF;
END
$$;

-- Ensure the sequence is owned by the id column
ALTER SEQUENCE IF EXISTS public.participant_events_id_seq OWNED BY public.participant_events.id;

-- Set the default value for the id column to use the sequence
ALTER TABLE ONLY public.participant_events ALTER COLUMN id SET DEFAULT nextval('public.participant_events_id_seq'::regclass);

-- Ensure the sequence is set to the correct next value
-- This will set the sequence to be greater than the maximum id currently in the table
SELECT setval('public.participant_events_id_seq', COALESCE((SELECT MAX(id) FROM public.participant_events), 0) + 1, false);