-- Create participant_event_types table
CREATE TABLE IF NOT EXISTS public.participant_event_types (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    PRIMARY KEY (id)
);

-- Create sequence for participant_event_types.id
CREATE SEQUENCE IF NOT EXISTS public.participant_event_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Set the ownership of sequence to the column
ALTER SEQUENCE public.participant_event_types_id_seq OWNED BY public.participant_event_types.id;

-- Set default value for id column
ALTER TABLE ONLY public.participant_event_types ALTER COLUMN id SET DEFAULT nextval('public.participant_event_types_id_seq'::regclass);

-- Add unique constraint on name
ALTER TABLE ONLY public.participant_event_types
    ADD CONSTRAINT participant_event_types_name_key UNIQUE (name);

-- Create participant_events table
CREATE TABLE IF NOT EXISTS public.participant_events (
    id integer NOT NULL,
    participant_id bigint NOT NULL,
    event_type_id integer NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (id)
);

-- Create sequence for participant_events.id
CREATE SEQUENCE IF NOT EXISTS public.participant_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Set the ownership of sequence to the column
ALTER SEQUENCE public.participant_events_id_seq OWNED BY public.participant_events.id;

-- Set default value for id column
ALTER TABLE ONLY public.participant_events ALTER COLUMN id SET DEFAULT nextval('public.participant_events_id_seq'::regclass);

-- Add foreign key constraints
ALTER TABLE ONLY public.participant_events
    ADD CONSTRAINT participant_events_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.participants(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.participant_events
    ADD CONSTRAINT participant_events_event_type_id_fkey FOREIGN KEY (event_type_id) REFERENCES public.participant_event_types(id) ON DELETE RESTRICT;

-- Add index for faster lookups
CREATE INDEX idx_participant_events_participant ON public.participant_events(participant_id);
CREATE INDEX idx_participant_events_type ON public.participant_events(event_type_id);

-- Insert initial event types
INSERT INTO public.participant_event_types (name, description) VALUES
('registration', 'Participant registered an account'),
('login', 'Participant logged into the system'),
('password_reset', 'Participant reset their password'),
('profile_update', 'Participant updated their profile information'),
('avatar_assignment', 'Participant was assigned an avatar');