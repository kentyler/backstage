--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: create_missing_sequences(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_missing_sequences() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    table_rec RECORD;
    column_rec RECORD;
    seq_name TEXT;
    max_val BIGINT;
BEGIN
    -- Loop through all tables in the public schema
    FOR table_rec IN 
        SELECT c.relname AS table_name
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'r'  -- only tables
        AND n.nspname = 'public'
    LOOP
        -- For each table, find the primary key column of type BIGINT
        FOR column_rec IN
            SELECT a.attname AS column_name
            FROM pg_attribute a
            JOIN pg_constraint c ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
            WHERE c.contype = 'p'  -- primary key
            AND a.attrelid = (SELECT oid FROM pg_class WHERE relname = table_rec.table_name)
            AND a.atttypid = 20  -- bigint type
        LOOP
            -- Create sequence name based on table and column
            seq_name := table_rec.table_name || '_' || column_rec.column_name || '_seq';
            
            -- Check if sequence already exists
            IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = seq_name) THEN
                -- Get max value from the table for the sequence start
                EXECUTE 'SELECT COALESCE(MAX(' || column_rec.column_name || '), 0) FROM ' || table_rec.table_name INTO max_val;
                
                -- Create the sequence
                EXECUTE 'CREATE SEQUENCE IF NOT EXISTS public.' || seq_name ||
                        ' START WITH ' || (max_val + 1) ||
                        ' INCREMENT BY 1' ||
                        ' NO MINVALUE' ||
                        ' NO MAXVALUE' ||
                        ' CACHE 1';
                
                -- Set the default value for the column
                EXECUTE 'ALTER TABLE public.' || table_rec.table_name || 
                        ' ALTER COLUMN ' || column_rec.column_name || 
                        ' SET DEFAULT nextval(''public.' || seq_name || ''')';
                
                -- Set the ownership of sequence to the column
                EXECUTE 'ALTER SEQUENCE public.' || seq_name || 
                        ' OWNED BY public.' || table_rec.table_name || '.' || column_rec.column_name;
                
                RAISE NOTICE 'Created sequence % for table %.%', 
                      seq_name, table_rec.table_name, column_rec.column_name;
            ELSE
                RAISE NOTICE 'Sequence % already exists', seq_name;
            END IF;
        END LOOP;
    END LOOP;
END;
$$;


--
-- Name: move_table_to_public(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.move_table_to_public(table_name text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    column_def text;
    table_def text;
    seq_name text;
    seq_exists boolean;
    id_default text;
    has_id boolean;
    constraint_def text;
    constraint_rec record;
BEGIN
    RAISE NOTICE 'Moving table % from dev to public', table_name;
    
    -- Check if table exists in dev schema
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'dev' AND table_name = move_table_to_public.table_name
    ) THEN
        RAISE EXCEPTION 'Table %.% does not exist', 'dev', move_table_to_public.table_name;
    END IF;
    
    -- Drop table from public schema if it exists
    EXECUTE 'DROP TABLE IF EXISTS public.' || table_name || ' CASCADE';
    
    -- Create table in public schema with the same structure
    EXECUTE 'CREATE TABLE public.' || table_name || ' (LIKE dev.' || table_name || ' INCLUDING ALL)';
    
    -- Check if there's an ID column with a sequence
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'dev' AND table_name = move_table_to_public.table_name
        AND column_name = 'id'
    ) INTO has_id;
    
    -- If there's an ID column, get its default value
    IF has_id THEN
        SELECT pg_get_expr(d.adbin, d.adrelid) INTO id_default
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_attribute a ON c.oid = a.attrelid
        JOIN pg_attrdef d ON c.oid = d.adrelid AND a.attnum = d.adnum
        WHERE n.nspname = 'dev'
        AND c.relname = move_table_to_public.table_name
        AND a.attname = 'id';
        
        -- If there's a sequence default, create or use a sequence in public schema
        IF id_default LIKE 'nextval%' THEN
            -- Extract sequence name from default value
            seq_name := regexp_replace(id_default, 'nextval\(''dev\.(.*)''.*', '\1');
            
            -- Check if sequence already exists in public schema
            SELECT EXISTS (
                SELECT 1 FROM pg_sequences 
                WHERE schemaname = 'public' AND sequencename = seq_name
            ) INTO seq_exists;
            
            -- Create sequence if it doesn't exist
            IF NOT seq_exists THEN
                EXECUTE 'CREATE SEQUENCE public.' || seq_name;
                
                -- Get current sequence value and set the new sequence to that value
                EXECUTE 'SELECT setval(''public.' || seq_name || ''', (SELECT COALESCE(max(id), 0) FROM dev.' || table_name || '), true)';
            END IF;
            
            -- Set the sequence as default for the id column
            EXECUTE 'ALTER TABLE public.' || table_name || ' ALTER COLUMN id SET DEFAULT nextval(''public.' || seq_name || ''')';
            
            -- Set sequence ownership
            EXECUTE 'ALTER SEQUENCE public.' || seq_name || ' OWNED BY public.' || table_name || '.id';
        END IF;
    END IF;
    
    -- Copy data from dev to public
    EXECUTE 'INSERT INTO public.' || table_name || ' SELECT * FROM dev.' || table_name;
    
    -- Update foreign key constraints to point to public schema tables if needed
    FOR constraint_rec IN
        SELECT 
            conname AS constraint_name,
            pg_get_constraintdef(c.oid) AS constraint_def
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND t.relname = move_table_to_public.table_name
        AND c.contype = 'f'
    LOOP
        -- If constraint references a dev schema table that we've moved to public, update it
        IF constraint_rec.constraint_def LIKE '%REFERENCES dev.event_types%' OR
           constraint_rec.constraint_def LIKE '%REFERENCES dev.file_types%' OR
           constraint_rec.constraint_def LIKE '%REFERENCES dev.avatar_event_types%' OR
           constraint_rec.constraint_def LIKE '%REFERENCES dev.avatar_scopes%' THEN
            
            -- Drop the constraint
            EXECUTE 'ALTER TABLE public.' || table_name || ' DROP CONSTRAINT ' || constraint_rec.constraint_name;
            
            -- Create new constraint pointing to public schema
            constraint_def := replace(constraint_rec.constraint_def, 'REFERENCES dev.', 'REFERENCES public.');
            EXECUTE 'ALTER TABLE public.' || table_name || ' ADD CONSTRAINT ' || constraint_rec.constraint_name || ' ' || constraint_def;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Completed moving table % to public schema', table_name;
END;
$$;


--
-- Name: update_participant_roles_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_participant_roles_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: llms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.llms (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    provider character varying(255) NOT NULL,
    model character varying(255) NOT NULL,
    api_key text NOT NULL,
    temperature double precision DEFAULT 0.7 NOT NULL,
    max_tokens integer DEFAULT 1000 NOT NULL,
    type_id integer,
    additional_config jsonb,
    subdomain character varying(255) DEFAULT 'public'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participants (
    id bigint NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: llm_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.llm_types (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    api_handler character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE llm_types; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.llm_types IS 'Lookup table for different LLM API types';


--
-- Name: COLUMN llm_types.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.llm_types.name IS 'Unique name for this LLM type';


--
-- Name: COLUMN llm_types.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.llm_types.description IS 'Description of this LLM type and its capabilities';


--
-- Name: COLUMN llm_types.api_handler; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.llm_types.api_handler IS 'The function or method that handles API calls for this type';


--
-- Name: preference_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preference_types (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE preference_types; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.preference_types IS 'Defines types of preferences that can be set at participant, group, or site level';


--
-- Name: COLUMN preference_types.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.preference_types.name IS 'Unique identifier for the preference type';


--
-- Name: COLUMN preference_types.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.preference_types.description IS 'Human-readable description of what this preference controls';


--
-- Name: avatar_event_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.avatar_event_types (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL
);


--
-- Name: avatar_event_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.avatar_event_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatar_event_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.avatar_event_types_id_seq OWNED BY public.avatar_event_types.id;


--
-- Name: event_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.event_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: file_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_types (
    id bigint NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: file_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.file_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: file_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.file_types_id_seq OWNED BY public.file_types.id;


--
-- Name: file_upload_vectors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_upload_vectors (
    id integer NOT NULL,
    file_upload_id integer NOT NULL,
    chunk_index integer NOT NULL,
    content_text text NOT NULL,
    content_vector public.vector(1536),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: file_upload_vectors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.file_upload_vectors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: file_upload_vectors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.file_upload_vectors_id_seq OWNED BY public.file_upload_vectors.id;


--
-- Name: file_uploads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_uploads (
    id integer NOT NULL,
    filename text NOT NULL,
    mime_type text,
    file_path text NOT NULL,
    file_size bigint,
    public_url text,
    bucket_name text,
    uploaded_at timestamp with time zone DEFAULT now(),
    description text,
    tags text[]
);


--
-- Name: file_uploads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.file_uploads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: file_uploads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.file_uploads_id_seq OWNED BY public.file_uploads.id;


--
-- Name: group_conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_types (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: group_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_types_id_seq OWNED BY public.group_types.id;


--
-- Name: groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: groups_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.groups_id_seq1
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: groups_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.groups_id_seq1 OWNED BY public.groups.id;


--
-- Name: grp_con_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grp_con_types (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: grp_con_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.grp_con_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.grp_con_types_id_seq OWNED BY public.grp_con_types.id;


--
-- Name: llm_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.llm_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: llm_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.llm_types_id_seq OWNED BY public.llm_types.id;


--
-- Name: llms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.llms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: llms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.llms_id_seq OWNED BY public.llms.id;


--
-- Name: message_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_types (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text
);


--
-- Name: message_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: message_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_types_id_seq OWNED BY public.message_types.id;


--
-- Name: participant_event_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participant_event_categories (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: participant_event_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.participant_event_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_event_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.participant_event_categories_id_seq OWNED BY public.participant_event_categories.id;


--
-- Name: participant_event_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participant_event_logs (
    id integer NOT NULL,
    schema_id integer,
    participant_id integer,
    event_type_id integer,
    description text,
    details jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: participant_event_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.participant_event_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_event_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.participant_event_logs_id_seq OWNED BY public.participant_event_logs.id;


--
-- Name: participant_event_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participant_event_types (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    participant_event_categories_id bigint
);


--
-- Name: participant_event_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.participant_event_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_event_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.participant_event_types_id_seq OWNED BY public.participant_event_types.id;


--
-- Name: participant_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participant_roles (
    role_id integer NOT NULL,
    role_name character varying(50) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE participant_roles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.participant_roles IS 'Lookup table for participant roles across all schemas';


--
-- Name: COLUMN participant_roles.role_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.participant_roles.role_id IS 'Unique identifier for the role';


--
-- Name: COLUMN participant_roles.role_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.participant_roles.role_name IS 'Name of the role (must be unique)';


--
-- Name: COLUMN participant_roles.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.participant_roles.description IS 'Description of the role and its privileges';


--
-- Name: participant_roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.participant_roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.participant_roles_role_id_seq OWNED BY public.participant_roles.role_id;


--
-- Name: preference_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.preference_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: preference_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.preference_types_id_seq OWNED BY public.preference_types.id;


--
-- Name: turn_relationship_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.turn_relationship_types (
    id bigint NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: relationship_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.relationship_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: relationship_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.relationship_types_id_seq OWNED BY public.turn_relationship_types.id;


--
-- Name: schemas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schemas (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    display_name character varying(255) NOT NULL,
    owner_participant_id integer,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb
);


--
-- Name: schemas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schemas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schemas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schemas_id_seq OWNED BY public.schemas.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: topic_paths_numeric_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.topic_paths_numeric_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: turn_kinds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.turn_kinds (
    id integer NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: turn_kinds_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.turn_kinds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: turn_kinds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.turn_kinds_id_seq OWNED BY public.turn_kinds.id;


--
-- Name: turn_relationship_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.turn_relationship_types_id_seq
    START WITH 3
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: turn_relationship_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.turn_relationship_types_id_seq OWNED BY public.turn_relationship_types.id;


--
-- Name: avatar_event_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avatar_event_types ALTER COLUMN id SET DEFAULT nextval('public.avatar_event_types_id_seq'::regclass);


--
-- Name: file_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_types ALTER COLUMN id SET DEFAULT nextval('public.file_types_id_seq'::regclass);


--
-- Name: file_upload_vectors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_upload_vectors ALTER COLUMN id SET DEFAULT nextval('public.file_upload_vectors_id_seq'::regclass);


--
-- Name: file_uploads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_uploads ALTER COLUMN id SET DEFAULT nextval('public.file_uploads_id_seq'::regclass);


--
-- Name: group_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_types ALTER COLUMN id SET DEFAULT nextval('public.group_types_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups ALTER COLUMN id SET DEFAULT nextval('public.groups_id_seq1'::regclass);


--
-- Name: grp_con_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grp_con_types ALTER COLUMN id SET DEFAULT nextval('public.grp_con_types_id_seq'::regclass);


--
-- Name: llm_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_types ALTER COLUMN id SET DEFAULT nextval('public.llm_types_id_seq'::regclass);


--
-- Name: llms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llms ALTER COLUMN id SET DEFAULT nextval('public.llms_id_seq'::regclass);


--
-- Name: message_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_types ALTER COLUMN id SET DEFAULT nextval('public.message_types_id_seq'::regclass);


--
-- Name: participant_event_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_event_categories ALTER COLUMN id SET DEFAULT nextval('public.participant_event_categories_id_seq'::regclass);


--
-- Name: participant_event_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_event_logs ALTER COLUMN id SET DEFAULT nextval('public.participant_event_logs_id_seq'::regclass);


--
-- Name: participant_roles role_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_roles ALTER COLUMN role_id SET DEFAULT nextval('public.participant_roles_role_id_seq'::regclass);


--
-- Name: preference_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preference_types ALTER COLUMN id SET DEFAULT nextval('public.preference_types_id_seq'::regclass);


--
-- Name: schemas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schemas ALTER COLUMN id SET DEFAULT nextval('public.schemas_id_seq'::regclass);


--
-- Name: turn_kinds id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.turn_kinds ALTER COLUMN id SET DEFAULT nextval('public.turn_kinds_id_seq'::regclass);


--
-- Name: turn_relationship_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.turn_relationship_types ALTER COLUMN id SET DEFAULT nextval('public.turn_relationship_types_id_seq'::regclass);


--
-- Name: avatar_event_types avatar_event_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avatar_event_types
    ADD CONSTRAINT avatar_event_types_name_key UNIQUE (name);


--
-- Name: avatar_event_types avatar_event_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avatar_event_types
    ADD CONSTRAINT avatar_event_types_pkey PRIMARY KEY (id);


--
-- Name: file_types file_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_types
    ADD CONSTRAINT file_types_name_key UNIQUE (name);


--
-- Name: file_types file_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_types
    ADD CONSTRAINT file_types_pkey PRIMARY KEY (id);


--
-- Name: file_upload_vectors file_upload_vectors_file_upload_id_chunk_index_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_upload_vectors
    ADD CONSTRAINT file_upload_vectors_file_upload_id_chunk_index_key UNIQUE (file_upload_id, chunk_index);


--
-- Name: file_upload_vectors file_upload_vectors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_upload_vectors
    ADD CONSTRAINT file_upload_vectors_pkey PRIMARY KEY (id);


--
-- Name: file_uploads file_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_uploads
    ADD CONSTRAINT file_uploads_pkey PRIMARY KEY (id);


--
-- Name: group_types group_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_types
    ADD CONSTRAINT group_types_name_key UNIQUE (name);


--
-- Name: group_types group_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_types
    ADD CONSTRAINT group_types_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: grp_con_types grp_con_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grp_con_types
    ADD CONSTRAINT grp_con_types_name_key UNIQUE (name);


--
-- Name: grp_con_types grp_con_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grp_con_types
    ADD CONSTRAINT grp_con_types_pkey PRIMARY KEY (id);


--
-- Name: llm_types llm_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_types
    ADD CONSTRAINT llm_types_name_key UNIQUE (name);


--
-- Name: llm_types llm_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_types
    ADD CONSTRAINT llm_types_pkey PRIMARY KEY (id);


--
-- Name: llms llms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llms
    ADD CONSTRAINT llms_pkey PRIMARY KEY (id);


--
-- Name: message_types message_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_types
    ADD CONSTRAINT message_types_name_key UNIQUE (name);


--
-- Name: message_types message_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_types
    ADD CONSTRAINT message_types_pkey PRIMARY KEY (id);


--
-- Name: participant_event_categories participant_event_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_event_categories
    ADD CONSTRAINT participant_event_categories_name_key UNIQUE (name);


--
-- Name: participant_event_categories participant_event_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_event_categories
    ADD CONSTRAINT participant_event_categories_pkey PRIMARY KEY (id);


--
-- Name: participant_event_logs participant_event_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_event_logs
    ADD CONSTRAINT participant_event_logs_pkey PRIMARY KEY (id);


--
-- Name: participant_event_types participant_event_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_event_types
    ADD CONSTRAINT participant_event_types_pkey PRIMARY KEY (id);


--
-- Name: participant_roles participant_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_roles
    ADD CONSTRAINT participant_roles_pkey PRIMARY KEY (role_id);


--
-- Name: participant_roles participant_roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_roles
    ADD CONSTRAINT participant_roles_role_name_key UNIQUE (role_name);


--
-- Name: participants participants_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_email_key UNIQUE (email);


--
-- Name: participants participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_pkey PRIMARY KEY (id);


--
-- Name: preference_types preference_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preference_types
    ADD CONSTRAINT preference_types_name_key UNIQUE (name);


--
-- Name: preference_types preference_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preference_types
    ADD CONSTRAINT preference_types_pkey PRIMARY KEY (id);


--
-- Name: turn_relationship_types relationship_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.turn_relationship_types
    ADD CONSTRAINT relationship_types_name_key UNIQUE (name);


--
-- Name: turn_relationship_types relationship_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.turn_relationship_types
    ADD CONSTRAINT relationship_types_pkey PRIMARY KEY (id);


--
-- Name: schemas schemas_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schemas
    ADD CONSTRAINT schemas_name_key UNIQUE (name);


--
-- Name: schemas schemas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schemas
    ADD CONSTRAINT schemas_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: turn_kinds turn_kinds_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.turn_kinds
    ADD CONSTRAINT turn_kinds_name_key UNIQUE (name);


--
-- Name: turn_kinds turn_kinds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.turn_kinds
    ADD CONSTRAINT turn_kinds_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: idx_schemas_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schemas_name ON public.schemas USING btree (name);


--
-- Name: idx_schemas_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schemas_owner ON public.schemas USING btree (owner_participant_id);


--
-- Name: participant_roles update_participant_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_participant_roles_updated_at BEFORE UPDATE ON public.participant_roles FOR EACH ROW EXECUTE FUNCTION public.update_participant_roles_updated_at();


--
-- Name: file_upload_vectors file_upload_vectors_file_upload_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_upload_vectors
    ADD CONSTRAINT file_upload_vectors_file_upload_id_fkey FOREIGN KEY (file_upload_id) REFERENCES public.file_uploads(id) ON DELETE CASCADE;


--
-- Name: llms llms_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llms
    ADD CONSTRAINT llms_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.llm_types(id);


--
-- Name: participant_event_logs participant_event_logs_event_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_event_logs
    ADD CONSTRAINT participant_event_logs_event_type_id_fkey FOREIGN KEY (event_type_id) REFERENCES public.participant_event_types(id);


--
-- Name: participant_event_logs participant_event_logs_participant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_event_logs
    ADD CONSTRAINT participant_event_logs_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.participants(id);


--
-- Name: participant_event_logs participant_event_logs_schema_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_event_logs
    ADD CONSTRAINT participant_event_logs_schema_id_fkey FOREIGN KEY (schema_id) REFERENCES public.schemas(id);


--
-- Name: schemas schemas_owner_participant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schemas
    ADD CONSTRAINT schemas_owner_participant_id_fkey FOREIGN KEY (owner_participant_id) REFERENCES public.participants(id);


--
-- PostgreSQL database dump complete
--

