--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
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
-- Name: bsa; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA bsa;


--
-- Name: conflict-club; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "conflict-club";


--
-- Name: conflict_club; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA conflict_club;


--
-- Name: dev; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA dev;


--
-- Name: first-congregational; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "first-congregational";


--
-- Name: first_congregational; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA first_congregational;


--
-- Name: template; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA template;


--
-- Name: time-that-remains; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "time-that-remains";


--
-- Name: timethatremains; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA timethatremains;


--
-- Name: ltree; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS ltree WITH SCHEMA public;


--
-- Name: EXTENSION ltree; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION ltree IS 'data type for hierarchical tree-like structures';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


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


--
-- Name: avatar_event_types_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.avatar_event_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: avatar_scopes; Type: TABLE; Schema: bsa; Owner: -
--

CREATE TABLE bsa.avatar_scopes (
    id integer NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: avatar_scopes_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.avatar_scopes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatar_scopes_id_seq; Type: SEQUENCE OWNED BY; Schema: bsa; Owner: -
--

ALTER SEQUENCE bsa.avatar_scopes_id_seq OWNED BY bsa.avatar_scopes.id;


--
-- Name: avatars; Type: TABLE; Schema: bsa; Owner: -
--

CREATE TABLE bsa.avatars (
    id bigint NOT NULL,
    name text NOT NULL,
    instruction_set text,
    created_at timestamp with time zone DEFAULT now(),
    avatar_scope_id integer DEFAULT 1 NOT NULL,
    llm_config jsonb
);


--
-- Name: avatars_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.avatars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatars_id_seq; Type: SEQUENCE OWNED BY; Schema: bsa; Owner: -
--

ALTER SEQUENCE bsa.avatars_id_seq OWNED BY bsa.avatars.id;


--
-- Name: file_types_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.file_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatar_turn_relationships_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.group_conversation_avatar_turn_relationships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatar_turns_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.group_conversation_avatar_turns_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatars_avatar_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.group_conversation_avatars_avatar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatars_group_conversation_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.group_conversation_avatars_group_conversation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_upload_vectors_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.group_conversation_upload_vectors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_uploads_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.group_conversation_uploads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversations_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.group_conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_preferences; Type: TABLE; Schema: bsa; Owner: -
--

CREATE TABLE bsa.group_preferences (
    id integer NOT NULL,
    group_id bigint NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: group_preferences_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.group_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: bsa; Owner: -
--

ALTER SEQUENCE bsa.group_preferences_id_seq OWNED BY bsa.group_preferences.id;


--
-- Name: groups; Type: TABLE; Schema: bsa; Owner: -
--

CREATE TABLE bsa.groups (
    id bigint NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    group_type_id integer
);


--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: bsa; Owner: -
--

ALTER SEQUENCE bsa.groups_id_seq OWNED BY bsa.groups.id;


--
-- Name: grp_con_avatar_turn_relationships; Type: TABLE; Schema: bsa; Owner: -
--

CREATE TABLE bsa.grp_con_avatar_turn_relationships (
    id bigint NOT NULL,
    turn_id bigint NOT NULL,
    target_turn_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    turn_relationship_type_id integer DEFAULT 1 NOT NULL
);


--
-- Name: grp_con_avatar_turn_relationships_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.grp_con_avatar_turn_relationships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatar_turn_relationships_id_seq; Type: SEQUENCE OWNED BY; Schema: bsa; Owner: -
--

ALTER SEQUENCE bsa.grp_con_avatar_turn_relationships_id_seq OWNED BY bsa.grp_con_avatar_turn_relationships.id;


--
-- Name: grp_con_avatar_turns; Type: TABLE; Schema: bsa; Owner: -
--

CREATE TABLE bsa.grp_con_avatar_turns (
    id bigint NOT NULL,
    grp_con_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    turn_index numeric(10,2) NOT NULL,
    content_text text NOT NULL,
    content_vector public.vector(1536),
    created_at timestamp with time zone DEFAULT now(),
    turn_kind_id integer NOT NULL,
    message_type_id integer,
    template_topic_id bigint
);


--
-- Name: grp_con_avatar_turns_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.grp_con_avatar_turns_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatar_turns_id_seq; Type: SEQUENCE OWNED BY; Schema: bsa; Owner: -
--

ALTER SEQUENCE bsa.grp_con_avatar_turns_id_seq OWNED BY bsa.grp_con_avatar_turns.id;


--
-- Name: grp_con_avatars; Type: TABLE; Schema: bsa; Owner: -
--

CREATE TABLE bsa.grp_con_avatars (
    grp_con_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    added_at timestamp with time zone DEFAULT now()
);


--
-- Name: grp_con_avatars_avatar_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.grp_con_avatars_avatar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatars_grp_con_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.grp_con_avatars_grp_con_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_upload_vectors; Type: TABLE; Schema: bsa; Owner: -
--

CREATE TABLE bsa.grp_con_upload_vectors (
    id bigint NOT NULL,
    upload_id bigint NOT NULL,
    chunk_index integer NOT NULL,
    content_text text NOT NULL,
    content_vector public.vector(1536),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: grp_con_upload_vectors_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.grp_con_upload_vectors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_upload_vectors_id_seq; Type: SEQUENCE OWNED BY; Schema: bsa; Owner: -
--

ALTER SEQUENCE bsa.grp_con_upload_vectors_id_seq OWNED BY bsa.grp_con_upload_vectors.id;


--
-- Name: grp_con_uploads; Type: TABLE; Schema: bsa; Owner: -
--

CREATE TABLE bsa.grp_con_uploads (
    id bigint NOT NULL,
    grp_con_id bigint NOT NULL,
    turn_id bigint NOT NULL,
    filename text NOT NULL,
    mime_type text,
    file_path text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now(),
    public_url text,
    bucket_name text
);


--
-- Name: grp_con_uploads_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.grp_con_uploads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_uploads_id_seq; Type: SEQUENCE OWNED BY; Schema: bsa; Owner: -
--

ALTER SEQUENCE bsa.grp_con_uploads_id_seq OWNED BY bsa.grp_con_uploads.id;


--
-- Name: grp_cons; Type: TABLE; Schema: bsa; Owner: -
--

CREATE TABLE bsa.grp_cons (
    id bigint NOT NULL,
    group_id bigint,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    type_id integer NOT NULL,
    parent_grp_con_id bigint,
    template_id integer
);


--
-- Name: COLUMN grp_cons.type_id; Type: COMMENT; Schema: bsa; Owner: -
--

COMMENT ON COLUMN bsa.grp_cons.type_id IS 'Reference to grp_con_types table defining the type of group conversation';


--
-- Name: COLUMN grp_cons.parent_grp_con_id; Type: COMMENT; Schema: bsa; Owner: -
--

COMMENT ON COLUMN bsa.grp_cons.parent_grp_con_id IS 'For template instances (type_id=3), references the parent template (type_id=2) this instance was created from';


--
-- Name: grp_cons_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.grp_cons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_cons_id_seq; Type: SEQUENCE OWNED BY; Schema: bsa; Owner: -
--

ALTER SEQUENCE bsa.grp_cons_id_seq OWNED BY bsa.grp_cons.id;


--
-- Name: grp_template_topics; Type: TABLE; Schema: bsa; Owner: -
--

CREATE TABLE bsa.grp_template_topics (
    id integer NOT NULL,
    template_id integer NOT NULL,
    title text NOT NULL,
    content text,
    topic_index numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE grp_template_topics; Type: COMMENT; Schema: bsa; Owner: -
--

COMMENT ON TABLE bsa.grp_template_topics IS 'Defines topics for templates';


--
-- Name: grp_template_topics_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.grp_template_topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_template_topics_id_seq; Type: SEQUENCE OWNED BY; Schema: bsa; Owner: -
--

ALTER SEQUENCE bsa.grp_template_topics_id_seq OWNED BY bsa.grp_template_topics.id;


--
-- Name: grp_templates; Type: TABLE; Schema: bsa; Owner: -
--

CREATE TABLE bsa.grp_templates (
    id integer NOT NULL,
    group_id bigint NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by_participant_id bigint
);


--
-- Name: TABLE grp_templates; Type: COMMENT; Schema: bsa; Owner: -
--

COMMENT ON TABLE bsa.grp_templates IS 'Defines templates that belong to groups';


--
-- Name: grp_templates_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.grp_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: bsa; Owner: -
--

ALTER SEQUENCE bsa.grp_templates_id_seq OWNED BY bsa.grp_templates.id;


--
-- Name: llm_types_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.llm_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_avatars; Type: TABLE; Schema: bsa; Owner: -
--

CREATE TABLE bsa.participant_avatars (
    id bigint NOT NULL,
    participant_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    created_at date DEFAULT CURRENT_DATE,
    created_by_participant_id bigint
);


--
-- Name: participant_avatars_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.participant_avatars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_avatars_id_seq; Type: SEQUENCE OWNED BY; Schema: bsa; Owner: -
--

ALTER SEQUENCE bsa.participant_avatars_id_seq OWNED BY bsa.participant_avatars.id;


--
-- Name: participant_event_types_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.participant_event_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_events; Type: TABLE; Schema: bsa; Owner: -
--

CREATE TABLE bsa.participant_events (
    id integer NOT NULL,
    participant_id bigint NOT NULL,
    event_type_id integer NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN participant_events.participant_id; Type: COMMENT; Schema: bsa; Owner: -
--

COMMENT ON COLUMN bsa.participant_events.participant_id IS 'The ID of the participant (can be null for events not associated with a specific participant, e.g., login attempts with non-existent emails)';


--
-- Name: participant_events_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.participant_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_events_id_seq; Type: SEQUENCE OWNED BY; Schema: bsa; Owner: -
--

ALTER SEQUENCE bsa.participant_events_id_seq OWNED BY bsa.participant_events.id;


--
-- Name: participant_groups; Type: TABLE; Schema: bsa; Owner: -
--

CREATE TABLE bsa.participant_groups (
    participant_id bigint NOT NULL,
    group_id bigint NOT NULL,
    role text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: participant_groups_group_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.participant_groups_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_groups_participant_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.participant_groups_participant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_llms; Type: TABLE; Schema: bsa; Owner: -
--

CREATE TABLE bsa.participant_llms (
    id bigint NOT NULL,
    participant_id bigint NOT NULL,
    llm_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: participant_llms_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.participant_llms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_llms_id_seq; Type: SEQUENCE OWNED BY; Schema: bsa; Owner: -
--

ALTER SEQUENCE bsa.participant_llms_id_seq OWNED BY bsa.participant_llms.id;


--
-- Name: participant_preferences; Type: TABLE; Schema: bsa; Owner: -
--

CREATE TABLE bsa.participant_preferences (
    id integer NOT NULL,
    participant_id bigint NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: participant_preferences_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.participant_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: bsa; Owner: -
--

ALTER SEQUENCE bsa.participant_preferences_id_seq OWNED BY bsa.participant_preferences.id;


--
-- Name: preference_types_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.preference_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: relationship_types_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.relationship_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_preferences; Type: TABLE; Schema: bsa; Owner: -
--

CREATE TABLE bsa.site_preferences (
    id integer NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: site_preferences_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.site_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: bsa; Owner: -
--

ALTER SEQUENCE bsa.site_preferences_id_seq OWNED BY bsa.site_preferences.id;


--
-- Name: turn_kinds_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.turn_kinds_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: turn_relationship_types_id_seq; Type: SEQUENCE; Schema: bsa; Owner: -
--

CREATE SEQUENCE bsa.turn_relationship_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatar_event_types_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.avatar_event_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatar_scopes; Type: TABLE; Schema: conflict_club; Owner: -
--

CREATE TABLE conflict_club.avatar_scopes (
    id integer NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: avatar_scopes_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.avatar_scopes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatar_scopes_id_seq; Type: SEQUENCE OWNED BY; Schema: conflict_club; Owner: -
--

ALTER SEQUENCE conflict_club.avatar_scopes_id_seq OWNED BY conflict_club.avatar_scopes.id;


--
-- Name: avatars; Type: TABLE; Schema: conflict_club; Owner: -
--

CREATE TABLE conflict_club.avatars (
    id bigint NOT NULL,
    name text NOT NULL,
    instruction_set text,
    created_at timestamp with time zone DEFAULT now(),
    avatar_scope_id integer DEFAULT 1 NOT NULL,
    llm_config jsonb
);


--
-- Name: avatars_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.avatars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatars_id_seq; Type: SEQUENCE OWNED BY; Schema: conflict_club; Owner: -
--

ALTER SEQUENCE conflict_club.avatars_id_seq OWNED BY conflict_club.avatars.id;


--
-- Name: file_types_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.file_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatar_turn_relationships_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.group_conversation_avatar_turn_relationships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatar_turns_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.group_conversation_avatar_turns_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatars_avatar_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.group_conversation_avatars_avatar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatars_group_conversation_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.group_conversation_avatars_group_conversation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_upload_vectors_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.group_conversation_upload_vectors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_uploads_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.group_conversation_uploads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversations_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.group_conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_preferences; Type: TABLE; Schema: conflict_club; Owner: -
--

CREATE TABLE conflict_club.group_preferences (
    id integer NOT NULL,
    group_id bigint NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: group_preferences_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.group_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: conflict_club; Owner: -
--

ALTER SEQUENCE conflict_club.group_preferences_id_seq OWNED BY conflict_club.group_preferences.id;


--
-- Name: groups; Type: TABLE; Schema: conflict_club; Owner: -
--

CREATE TABLE conflict_club.groups (
    id bigint NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: conflict_club; Owner: -
--

ALTER SEQUENCE conflict_club.groups_id_seq OWNED BY conflict_club.groups.id;


--
-- Name: grp_con_avatar_turn_relationships; Type: TABLE; Schema: conflict_club; Owner: -
--

CREATE TABLE conflict_club.grp_con_avatar_turn_relationships (
    id bigint NOT NULL,
    turn_id bigint NOT NULL,
    target_turn_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    turn_relationship_type_id integer DEFAULT 1 NOT NULL
);


--
-- Name: grp_con_avatar_turn_relationships_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.grp_con_avatar_turn_relationships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatar_turn_relationships_id_seq; Type: SEQUENCE OWNED BY; Schema: conflict_club; Owner: -
--

ALTER SEQUENCE conflict_club.grp_con_avatar_turn_relationships_id_seq OWNED BY conflict_club.grp_con_avatar_turn_relationships.id;


--
-- Name: grp_con_avatar_turns; Type: TABLE; Schema: conflict_club; Owner: -
--

CREATE TABLE conflict_club.grp_con_avatar_turns (
    id bigint NOT NULL,
    grp_con_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    turn_index numeric(10,2) NOT NULL,
    content_text text NOT NULL,
    content_vector public.vector(1536),
    created_at timestamp with time zone DEFAULT now(),
    turn_kind_id integer NOT NULL,
    message_type_id integer,
    template_topic_id bigint
);


--
-- Name: grp_con_avatar_turns_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.grp_con_avatar_turns_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatar_turns_id_seq; Type: SEQUENCE OWNED BY; Schema: conflict_club; Owner: -
--

ALTER SEQUENCE conflict_club.grp_con_avatar_turns_id_seq OWNED BY conflict_club.grp_con_avatar_turns.id;


--
-- Name: grp_con_avatars; Type: TABLE; Schema: conflict_club; Owner: -
--

CREATE TABLE conflict_club.grp_con_avatars (
    grp_con_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    added_at timestamp with time zone DEFAULT now()
);


--
-- Name: grp_con_avatars_avatar_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.grp_con_avatars_avatar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatars_grp_con_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.grp_con_avatars_grp_con_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_upload_vectors; Type: TABLE; Schema: conflict_club; Owner: -
--

CREATE TABLE conflict_club.grp_con_upload_vectors (
    id bigint NOT NULL,
    upload_id bigint NOT NULL,
    chunk_index integer NOT NULL,
    content_text text NOT NULL,
    content_vector public.vector(1536),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: grp_con_upload_vectors_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.grp_con_upload_vectors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_upload_vectors_id_seq; Type: SEQUENCE OWNED BY; Schema: conflict_club; Owner: -
--

ALTER SEQUENCE conflict_club.grp_con_upload_vectors_id_seq OWNED BY conflict_club.grp_con_upload_vectors.id;


--
-- Name: grp_con_uploads; Type: TABLE; Schema: conflict_club; Owner: -
--

CREATE TABLE conflict_club.grp_con_uploads (
    id bigint NOT NULL,
    grp_con_id bigint NOT NULL,
    turn_id bigint NOT NULL,
    filename text NOT NULL,
    mime_type text,
    file_path text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now(),
    public_url text,
    bucket_name text
);


--
-- Name: grp_con_uploads_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.grp_con_uploads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_uploads_id_seq; Type: SEQUENCE OWNED BY; Schema: conflict_club; Owner: -
--

ALTER SEQUENCE conflict_club.grp_con_uploads_id_seq OWNED BY conflict_club.grp_con_uploads.id;


--
-- Name: grp_cons; Type: TABLE; Schema: conflict_club; Owner: -
--

CREATE TABLE conflict_club.grp_cons (
    id bigint NOT NULL,
    group_id bigint,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    type_id integer NOT NULL,
    parent_grp_con_id bigint,
    template_id integer
);


--
-- Name: COLUMN grp_cons.type_id; Type: COMMENT; Schema: conflict_club; Owner: -
--

COMMENT ON COLUMN conflict_club.grp_cons.type_id IS 'Reference to grp_con_types table defining the type of group conversation';


--
-- Name: COLUMN grp_cons.parent_grp_con_id; Type: COMMENT; Schema: conflict_club; Owner: -
--

COMMENT ON COLUMN conflict_club.grp_cons.parent_grp_con_id IS 'For template instances (type_id=3), references the parent template (type_id=2) this instance was created from';


--
-- Name: grp_cons_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.grp_cons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_cons_id_seq; Type: SEQUENCE OWNED BY; Schema: conflict_club; Owner: -
--

ALTER SEQUENCE conflict_club.grp_cons_id_seq OWNED BY conflict_club.grp_cons.id;


--
-- Name: grp_template_topics; Type: TABLE; Schema: conflict_club; Owner: -
--

CREATE TABLE conflict_club.grp_template_topics (
    id integer NOT NULL,
    template_id integer NOT NULL,
    title text NOT NULL,
    content text,
    topic_index numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE grp_template_topics; Type: COMMENT; Schema: conflict_club; Owner: -
--

COMMENT ON TABLE conflict_club.grp_template_topics IS 'Defines topics for templates';


--
-- Name: grp_template_topics_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.grp_template_topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_template_topics_id_seq; Type: SEQUENCE OWNED BY; Schema: conflict_club; Owner: -
--

ALTER SEQUENCE conflict_club.grp_template_topics_id_seq OWNED BY conflict_club.grp_template_topics.id;


--
-- Name: grp_templates; Type: TABLE; Schema: conflict_club; Owner: -
--

CREATE TABLE conflict_club.grp_templates (
    id integer NOT NULL,
    group_id bigint NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by_participant_id bigint
);


--
-- Name: TABLE grp_templates; Type: COMMENT; Schema: conflict_club; Owner: -
--

COMMENT ON TABLE conflict_club.grp_templates IS 'Defines templates that belong to groups';


--
-- Name: grp_templates_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.grp_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: conflict_club; Owner: -
--

ALTER SEQUENCE conflict_club.grp_templates_id_seq OWNED BY conflict_club.grp_templates.id;


--
-- Name: llm_types_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.llm_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_avatars; Type: TABLE; Schema: conflict_club; Owner: -
--

CREATE TABLE conflict_club.participant_avatars (
    id bigint NOT NULL,
    participant_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    created_at date DEFAULT CURRENT_DATE,
    created_by_participant_id bigint
);


--
-- Name: participant_avatars_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.participant_avatars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_avatars_id_seq; Type: SEQUENCE OWNED BY; Schema: conflict_club; Owner: -
--

ALTER SEQUENCE conflict_club.participant_avatars_id_seq OWNED BY conflict_club.participant_avatars.id;


--
-- Name: participant_event_types_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.participant_event_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_events; Type: TABLE; Schema: conflict_club; Owner: -
--

CREATE TABLE conflict_club.participant_events (
    id integer NOT NULL,
    participant_id bigint NOT NULL,
    event_type_id integer NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN participant_events.participant_id; Type: COMMENT; Schema: conflict_club; Owner: -
--

COMMENT ON COLUMN conflict_club.participant_events.participant_id IS 'The ID of the participant (can be null for events not associated with a specific participant, e.g., login attempts with non-existent emails)';


--
-- Name: participant_events_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.participant_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_events_id_seq; Type: SEQUENCE OWNED BY; Schema: conflict_club; Owner: -
--

ALTER SEQUENCE conflict_club.participant_events_id_seq OWNED BY conflict_club.participant_events.id;


--
-- Name: participant_groups; Type: TABLE; Schema: conflict_club; Owner: -
--

CREATE TABLE conflict_club.participant_groups (
    participant_id bigint NOT NULL,
    group_id bigint NOT NULL,
    role text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: participant_groups_group_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.participant_groups_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_groups_participant_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.participant_groups_participant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_llms; Type: TABLE; Schema: conflict_club; Owner: -
--

CREATE TABLE conflict_club.participant_llms (
    id bigint NOT NULL,
    participant_id bigint NOT NULL,
    llm_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: participant_llms_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.participant_llms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_llms_id_seq; Type: SEQUENCE OWNED BY; Schema: conflict_club; Owner: -
--

ALTER SEQUENCE conflict_club.participant_llms_id_seq OWNED BY conflict_club.participant_llms.id;


--
-- Name: participant_preferences; Type: TABLE; Schema: conflict_club; Owner: -
--

CREATE TABLE conflict_club.participant_preferences (
    id integer NOT NULL,
    participant_id bigint NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: participant_preferences_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.participant_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: conflict_club; Owner: -
--

ALTER SEQUENCE conflict_club.participant_preferences_id_seq OWNED BY conflict_club.participant_preferences.id;


--
-- Name: preference_types_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.preference_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: relationship_types_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.relationship_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_preferences; Type: TABLE; Schema: conflict_club; Owner: -
--

CREATE TABLE conflict_club.site_preferences (
    id integer NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: site_preferences_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.site_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: conflict_club; Owner: -
--

ALTER SEQUENCE conflict_club.site_preferences_id_seq OWNED BY conflict_club.site_preferences.id;


--
-- Name: turn_kinds_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.turn_kinds_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: turn_relationship_types_id_seq; Type: SEQUENCE; Schema: conflict_club; Owner: -
--

CREATE SEQUENCE conflict_club.turn_relationship_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatar_event_types; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.avatar_event_types (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL
);


--
-- Name: avatar_event_types_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.avatar_event_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatar_event_types_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.avatar_event_types_id_seq OWNED BY dev.avatar_event_types.id;


--
-- Name: avatar_scopes; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.avatar_scopes (
    id integer NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: avatar_scopes_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.avatar_scopes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatar_scopes_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.avatar_scopes_id_seq OWNED BY dev.avatar_scopes.id;


--
-- Name: avatars; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.avatars (
    id bigint NOT NULL,
    name text NOT NULL,
    instruction_set text,
    created_at timestamp with time zone DEFAULT now(),
    avatar_scope_id integer DEFAULT 1 NOT NULL,
    llm_config jsonb
);


--
-- Name: avatars_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.avatars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatars_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.avatars_id_seq OWNED BY dev.avatars.id;


--
-- Name: client_schema_preferences; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.client_schema_preferences (
    id integer NOT NULL,
    client_schema_id integer NOT NULL,
    preference_type_id integer NOT NULL,
    preference_value text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_schema_preferences_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.client_schema_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: client_schema_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.client_schema_preferences_id_seq OWNED BY dev.client_schema_preferences.id;


--
-- Name: client_schemas; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.client_schemas (
    id integer NOT NULL,
    client_id integer NOT NULL,
    schema_name character varying(63) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_schemas_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.client_schemas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: client_schemas_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.client_schemas_id_seq OWNED BY dev.client_schemas.id;


--
-- Name: clients; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.clients (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.clients_id_seq OWNED BY dev.clients.id;


--
-- Name: event_types; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.event_types (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: event_types_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.event_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: event_types_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.event_types_id_seq OWNED BY dev.event_types.id;


--
-- Name: file_types; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.file_types (
    id bigint NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: file_types_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.file_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: file_types_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.file_types_id_seq OWNED BY dev.file_types.id;


--
-- Name: group_conversation_avatar_turn_relationships_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.group_conversation_avatar_turn_relationships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatar_turns_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.group_conversation_avatar_turns_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatars_avatar_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.group_conversation_avatars_avatar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatars_group_conversation_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.group_conversation_avatars_group_conversation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_upload_vectors_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.group_conversation_upload_vectors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_uploads_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.group_conversation_uploads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversations_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.group_conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_preferences; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.group_preferences (
    id integer NOT NULL,
    group_id bigint NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: group_preferences_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.group_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.group_preferences_id_seq OWNED BY dev.group_preferences.id;


--
-- Name: groups; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.groups (
    id bigint NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    group_type_id integer
);


--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.groups_id_seq OWNED BY dev.groups.id;


--
-- Name: grp_con_avatar_turn_relationships; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.grp_con_avatar_turn_relationships (
    id bigint NOT NULL,
    turn_id bigint NOT NULL,
    target_turn_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    turn_relationship_type_id integer DEFAULT 1 NOT NULL
);


--
-- Name: grp_con_avatar_turn_relationships_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.grp_con_avatar_turn_relationships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatar_turn_relationships_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.grp_con_avatar_turn_relationships_id_seq OWNED BY dev.grp_con_avatar_turn_relationships.id;


--
-- Name: grp_con_avatar_turns; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.grp_con_avatar_turns (
    id bigint NOT NULL,
    grp_con_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    turn_index numeric(10,2) NOT NULL,
    content_text text NOT NULL,
    content_vector public.vector(1536),
    created_at timestamp with time zone DEFAULT now(),
    turn_kind_id integer NOT NULL,
    message_type_id integer,
    template_topic_id bigint
);


--
-- Name: grp_con_avatar_turns_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.grp_con_avatar_turns_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatar_turns_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.grp_con_avatar_turns_id_seq OWNED BY dev.grp_con_avatar_turns.id;


--
-- Name: grp_con_avatars; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.grp_con_avatars (
    grp_con_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    added_at timestamp with time zone DEFAULT now()
);


--
-- Name: grp_con_avatars_avatar_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.grp_con_avatars_avatar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatars_grp_con_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.grp_con_avatars_grp_con_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_upload_vectors; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.grp_con_upload_vectors (
    id bigint NOT NULL,
    upload_id bigint NOT NULL,
    chunk_index integer NOT NULL,
    content_text text NOT NULL,
    content_vector public.vector(1536),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: grp_con_upload_vectors_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.grp_con_upload_vectors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_upload_vectors_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.grp_con_upload_vectors_id_seq OWNED BY dev.grp_con_upload_vectors.id;


--
-- Name: grp_con_uploads; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.grp_con_uploads (
    id bigint NOT NULL,
    grp_con_id bigint NOT NULL,
    turn_id bigint NOT NULL,
    filename text NOT NULL,
    mime_type text,
    file_path text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now(),
    public_url text,
    bucket_name text
);


--
-- Name: grp_con_uploads_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.grp_con_uploads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_uploads_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.grp_con_uploads_id_seq OWNED BY dev.grp_con_uploads.id;


--
-- Name: grp_cons; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.grp_cons (
    id bigint NOT NULL,
    group_id bigint,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    type_id integer,
    parent_grp_con_id bigint,
    template_id integer
);


--
-- Name: COLUMN grp_cons.parent_grp_con_id; Type: COMMENT; Schema: dev; Owner: -
--

COMMENT ON COLUMN dev.grp_cons.parent_grp_con_id IS 'For template instances (type_id=3), references the parent template (type_id=2) this instance was created from';


--
-- Name: grp_cons_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.grp_cons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_cons_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.grp_cons_id_seq OWNED BY dev.grp_cons.id;


--
-- Name: grp_template_topics; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.grp_template_topics (
    id integer NOT NULL,
    template_id integer NOT NULL,
    title text NOT NULL,
    content text,
    topic_index numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE grp_template_topics; Type: COMMENT; Schema: dev; Owner: -
--

COMMENT ON TABLE dev.grp_template_topics IS 'Defines topics for templates';


--
-- Name: grp_template_topics_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.grp_template_topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_template_topics_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.grp_template_topics_id_seq OWNED BY dev.grp_template_topics.id;


--
-- Name: grp_templates; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.grp_templates (
    id integer NOT NULL,
    group_id bigint NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by_participant_id bigint
);


--
-- Name: TABLE grp_templates; Type: COMMENT; Schema: dev; Owner: -
--

COMMENT ON TABLE dev.grp_templates IS 'Defines templates that belong to groups';


--
-- Name: grp_templates_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.grp_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.grp_templates_id_seq OWNED BY dev.grp_templates.id;


--
-- Name: participant_avatars; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.participant_avatars (
    id bigint NOT NULL,
    participant_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    created_at date DEFAULT CURRENT_DATE,
    created_by_participant_id bigint
);


--
-- Name: participant_avatars_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.participant_avatars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_avatars_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.participant_avatars_id_seq OWNED BY dev.participant_avatars.id;


--
-- Name: participant_event_types; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.participant_event_types (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL
);


--
-- Name: participant_event_types_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.participant_event_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_event_types_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.participant_event_types_id_seq OWNED BY dev.participant_event_types.id;


--
-- Name: participant_events; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.participant_events (
    id integer NOT NULL,
    participant_id bigint NOT NULL,
    event_type_id integer NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN participant_events.participant_id; Type: COMMENT; Schema: dev; Owner: -
--

COMMENT ON COLUMN dev.participant_events.participant_id IS 'The ID of the participant (can be null for events not associated with a specific participant, e.g., login attempts with non-existent emails)';


--
-- Name: participant_events_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.participant_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_events_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.participant_events_id_seq OWNED BY dev.participant_events.id;


--
-- Name: participant_groups; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.participant_groups (
    participant_id bigint NOT NULL,
    group_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    participant_role_id integer NOT NULL
);


--
-- Name: COLUMN participant_groups.participant_role_id; Type: COMMENT; Schema: dev; Owner: -
--

COMMENT ON COLUMN dev.participant_groups.participant_role_id IS 'Foreign key to public.participant_roles defining the participant''s role in the group';


--
-- Name: participant_groups_group_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.participant_groups_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_groups_participant_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.participant_groups_participant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_llms; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.participant_llms (
    id bigint NOT NULL,
    participant_id bigint NOT NULL,
    llm_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: participant_llms_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.participant_llms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_llms_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.participant_llms_id_seq OWNED BY dev.participant_llms.id;


--
-- Name: participant_preferences; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.participant_preferences (
    id integer NOT NULL,
    participant_id bigint NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: participant_preferences_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.participant_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.participant_preferences_id_seq OWNED BY dev.participant_preferences.id;


--
-- Name: relationship_types_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.relationship_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_preferences; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.site_preferences (
    id integer NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: site_preferences_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.site_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.site_preferences_id_seq OWNED BY dev.site_preferences.id;


--
-- Name: topic_paths; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE dev.topic_paths (
    id bigint NOT NULL,
    path public.ltree NOT NULL,
    created_by integer,
    created_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_path CHECK ((path IS NOT NULL))
);


--
-- Name: topic_paths_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE dev.topic_paths_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: topic_paths_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE dev.topic_paths_id_seq OWNED BY dev.topic_paths.id;


--
-- Name: avatar_event_types_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.avatar_event_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatar_scopes; Type: TABLE; Schema: first_congregational; Owner: -
--

CREATE TABLE first_congregational.avatar_scopes (
    id integer NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: avatar_scopes_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.avatar_scopes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatar_scopes_id_seq; Type: SEQUENCE OWNED BY; Schema: first_congregational; Owner: -
--

ALTER SEQUENCE first_congregational.avatar_scopes_id_seq OWNED BY first_congregational.avatar_scopes.id;


--
-- Name: avatars; Type: TABLE; Schema: first_congregational; Owner: -
--

CREATE TABLE first_congregational.avatars (
    id bigint NOT NULL,
    name text NOT NULL,
    instruction_set text,
    created_at timestamp with time zone DEFAULT now(),
    avatar_scope_id integer DEFAULT 1 NOT NULL,
    llm_config jsonb
);


--
-- Name: avatars_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.avatars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatars_id_seq; Type: SEQUENCE OWNED BY; Schema: first_congregational; Owner: -
--

ALTER SEQUENCE first_congregational.avatars_id_seq OWNED BY first_congregational.avatars.id;


--
-- Name: file_types_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.file_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatar_turn_relationships_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.group_conversation_avatar_turn_relationships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatar_turns_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.group_conversation_avatar_turns_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatars_avatar_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.group_conversation_avatars_avatar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatars_group_conversation_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.group_conversation_avatars_group_conversation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_upload_vectors_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.group_conversation_upload_vectors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_uploads_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.group_conversation_uploads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversations_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.group_conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_preferences; Type: TABLE; Schema: first_congregational; Owner: -
--

CREATE TABLE first_congregational.group_preferences (
    id integer NOT NULL,
    group_id bigint NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: group_preferences_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.group_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: first_congregational; Owner: -
--

ALTER SEQUENCE first_congregational.group_preferences_id_seq OWNED BY first_congregational.group_preferences.id;


--
-- Name: groups; Type: TABLE; Schema: first_congregational; Owner: -
--

CREATE TABLE first_congregational.groups (
    id bigint NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    group_type_id integer
);


--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: first_congregational; Owner: -
--

ALTER SEQUENCE first_congregational.groups_id_seq OWNED BY first_congregational.groups.id;


--
-- Name: grp_con_avatar_turn_relationships; Type: TABLE; Schema: first_congregational; Owner: -
--

CREATE TABLE first_congregational.grp_con_avatar_turn_relationships (
    id bigint NOT NULL,
    turn_id bigint NOT NULL,
    target_turn_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    turn_relationship_type_id integer DEFAULT 1 NOT NULL
);


--
-- Name: grp_con_avatar_turn_relationships_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.grp_con_avatar_turn_relationships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatar_turn_relationships_id_seq; Type: SEQUENCE OWNED BY; Schema: first_congregational; Owner: -
--

ALTER SEQUENCE first_congregational.grp_con_avatar_turn_relationships_id_seq OWNED BY first_congregational.grp_con_avatar_turn_relationships.id;


--
-- Name: grp_con_avatar_turns; Type: TABLE; Schema: first_congregational; Owner: -
--

CREATE TABLE first_congregational.grp_con_avatar_turns (
    id bigint NOT NULL,
    grp_con_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    turn_index numeric(10,2) NOT NULL,
    content_text text NOT NULL,
    content_vector public.vector(1536),
    created_at timestamp with time zone DEFAULT now(),
    turn_kind_id integer NOT NULL,
    message_type_id integer,
    template_topic_id bigint
);


--
-- Name: grp_con_avatar_turns_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.grp_con_avatar_turns_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatar_turns_id_seq; Type: SEQUENCE OWNED BY; Schema: first_congregational; Owner: -
--

ALTER SEQUENCE first_congregational.grp_con_avatar_turns_id_seq OWNED BY first_congregational.grp_con_avatar_turns.id;


--
-- Name: grp_con_avatars; Type: TABLE; Schema: first_congregational; Owner: -
--

CREATE TABLE first_congregational.grp_con_avatars (
    grp_con_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    added_at timestamp with time zone DEFAULT now()
);


--
-- Name: grp_con_avatars_avatar_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.grp_con_avatars_avatar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatars_grp_con_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.grp_con_avatars_grp_con_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_upload_vectors; Type: TABLE; Schema: first_congregational; Owner: -
--

CREATE TABLE first_congregational.grp_con_upload_vectors (
    id bigint NOT NULL,
    upload_id bigint NOT NULL,
    chunk_index integer NOT NULL,
    content_text text NOT NULL,
    content_vector public.vector(1536),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: grp_con_upload_vectors_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.grp_con_upload_vectors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_upload_vectors_id_seq; Type: SEQUENCE OWNED BY; Schema: first_congregational; Owner: -
--

ALTER SEQUENCE first_congregational.grp_con_upload_vectors_id_seq OWNED BY first_congregational.grp_con_upload_vectors.id;


--
-- Name: grp_con_uploads; Type: TABLE; Schema: first_congregational; Owner: -
--

CREATE TABLE first_congregational.grp_con_uploads (
    id bigint NOT NULL,
    grp_con_id bigint NOT NULL,
    turn_id bigint NOT NULL,
    filename text NOT NULL,
    mime_type text,
    file_path text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now(),
    public_url text,
    bucket_name text
);


--
-- Name: grp_con_uploads_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.grp_con_uploads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_uploads_id_seq; Type: SEQUENCE OWNED BY; Schema: first_congregational; Owner: -
--

ALTER SEQUENCE first_congregational.grp_con_uploads_id_seq OWNED BY first_congregational.grp_con_uploads.id;


--
-- Name: grp_cons; Type: TABLE; Schema: first_congregational; Owner: -
--

CREATE TABLE first_congregational.grp_cons (
    id bigint NOT NULL,
    group_id bigint,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    type_id integer NOT NULL,
    parent_grp_con_id bigint,
    template_id integer
);


--
-- Name: COLUMN grp_cons.type_id; Type: COMMENT; Schema: first_congregational; Owner: -
--

COMMENT ON COLUMN first_congregational.grp_cons.type_id IS 'Reference to grp_con_types table defining the type of group conversation';


--
-- Name: COLUMN grp_cons.parent_grp_con_id; Type: COMMENT; Schema: first_congregational; Owner: -
--

COMMENT ON COLUMN first_congregational.grp_cons.parent_grp_con_id IS 'For template instances (type_id=3), references the parent template (type_id=2) this instance was created from';


--
-- Name: grp_cons_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.grp_cons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_cons_id_seq; Type: SEQUENCE OWNED BY; Schema: first_congregational; Owner: -
--

ALTER SEQUENCE first_congregational.grp_cons_id_seq OWNED BY first_congregational.grp_cons.id;


--
-- Name: grp_template_topics; Type: TABLE; Schema: first_congregational; Owner: -
--

CREATE TABLE first_congregational.grp_template_topics (
    id integer NOT NULL,
    template_id integer NOT NULL,
    title text NOT NULL,
    content text,
    topic_index numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE grp_template_topics; Type: COMMENT; Schema: first_congregational; Owner: -
--

COMMENT ON TABLE first_congregational.grp_template_topics IS 'Defines topics for templates';


--
-- Name: grp_template_topics_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.grp_template_topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_template_topics_id_seq; Type: SEQUENCE OWNED BY; Schema: first_congregational; Owner: -
--

ALTER SEQUENCE first_congregational.grp_template_topics_id_seq OWNED BY first_congregational.grp_template_topics.id;


--
-- Name: grp_templates; Type: TABLE; Schema: first_congregational; Owner: -
--

CREATE TABLE first_congregational.grp_templates (
    id integer NOT NULL,
    group_id bigint NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by_participant_id bigint
);


--
-- Name: TABLE grp_templates; Type: COMMENT; Schema: first_congregational; Owner: -
--

COMMENT ON TABLE first_congregational.grp_templates IS 'Defines templates that belong to groups';


--
-- Name: grp_templates_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.grp_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: first_congregational; Owner: -
--

ALTER SEQUENCE first_congregational.grp_templates_id_seq OWNED BY first_congregational.grp_templates.id;


--
-- Name: llm_types_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.llm_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_avatars; Type: TABLE; Schema: first_congregational; Owner: -
--

CREATE TABLE first_congregational.participant_avatars (
    id bigint NOT NULL,
    participant_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    created_at date DEFAULT CURRENT_DATE,
    created_by_participant_id bigint
);


--
-- Name: participant_avatars_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.participant_avatars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_avatars_id_seq; Type: SEQUENCE OWNED BY; Schema: first_congregational; Owner: -
--

ALTER SEQUENCE first_congregational.participant_avatars_id_seq OWNED BY first_congregational.participant_avatars.id;


--
-- Name: participant_event_types_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.participant_event_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_events; Type: TABLE; Schema: first_congregational; Owner: -
--

CREATE TABLE first_congregational.participant_events (
    id integer NOT NULL,
    participant_id bigint NOT NULL,
    event_type_id integer NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN participant_events.participant_id; Type: COMMENT; Schema: first_congregational; Owner: -
--

COMMENT ON COLUMN first_congregational.participant_events.participant_id IS 'The ID of the participant (can be null for events not associated with a specific participant, e.g., login attempts with non-existent emails)';


--
-- Name: participant_events_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.participant_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_events_id_seq; Type: SEQUENCE OWNED BY; Schema: first_congregational; Owner: -
--

ALTER SEQUENCE first_congregational.participant_events_id_seq OWNED BY first_congregational.participant_events.id;


--
-- Name: participant_groups; Type: TABLE; Schema: first_congregational; Owner: -
--

CREATE TABLE first_congregational.participant_groups (
    participant_id bigint NOT NULL,
    group_id bigint NOT NULL,
    role text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: participant_groups_group_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.participant_groups_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_groups_participant_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.participant_groups_participant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_llms; Type: TABLE; Schema: first_congregational; Owner: -
--

CREATE TABLE first_congregational.participant_llms (
    id bigint NOT NULL,
    participant_id bigint NOT NULL,
    llm_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: participant_llms_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.participant_llms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_llms_id_seq; Type: SEQUENCE OWNED BY; Schema: first_congregational; Owner: -
--

ALTER SEQUENCE first_congregational.participant_llms_id_seq OWNED BY first_congregational.participant_llms.id;


--
-- Name: participant_preferences; Type: TABLE; Schema: first_congregational; Owner: -
--

CREATE TABLE first_congregational.participant_preferences (
    id integer NOT NULL,
    participant_id bigint NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: participant_preferences_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.participant_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: first_congregational; Owner: -
--

ALTER SEQUENCE first_congregational.participant_preferences_id_seq OWNED BY first_congregational.participant_preferences.id;


--
-- Name: preference_types_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.preference_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: relationship_types_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.relationship_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_preferences; Type: TABLE; Schema: first_congregational; Owner: -
--

CREATE TABLE first_congregational.site_preferences (
    id integer NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: site_preferences_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.site_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: first_congregational; Owner: -
--

ALTER SEQUENCE first_congregational.site_preferences_id_seq OWNED BY first_congregational.site_preferences.id;


--
-- Name: turn_kinds_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.turn_kinds_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: turn_relationship_types_id_seq; Type: SEQUENCE; Schema: first_congregational; Owner: -
--

CREATE SEQUENCE first_congregational.turn_relationship_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


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
-- Name: participant_event_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participant_event_types (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL
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
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


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
-- Name: avatar_event_types; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.avatar_event_types (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL
);


--
-- Name: avatar_event_types_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.avatar_event_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatar_event_types_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.avatar_event_types_id_seq OWNED BY template.avatar_event_types.id;


--
-- Name: avatar_scopes; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.avatar_scopes (
    id integer NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: avatar_scopes_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.avatar_scopes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatar_scopes_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.avatar_scopes_id_seq OWNED BY template.avatar_scopes.id;


--
-- Name: avatars; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.avatars (
    id bigint NOT NULL,
    name text NOT NULL,
    instruction_set text,
    created_at timestamp with time zone DEFAULT now(),
    avatar_scope_id integer DEFAULT 1 NOT NULL,
    llm_config jsonb
);


--
-- Name: avatars_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.avatars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatars_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.avatars_id_seq OWNED BY template.avatars.id;


--
-- Name: file_types; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.file_types (
    id bigint NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: file_types_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.file_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: file_types_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.file_types_id_seq OWNED BY template.file_types.id;


--
-- Name: group_conversation_avatar_turn_relationships_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.group_conversation_avatar_turn_relationships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatar_turns_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.group_conversation_avatar_turns_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatars_avatar_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.group_conversation_avatars_avatar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatars_group_conversation_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.group_conversation_avatars_group_conversation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_upload_vectors_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.group_conversation_upload_vectors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_uploads_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.group_conversation_uploads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversations_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.group_conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_preferences; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.group_preferences (
    id integer NOT NULL,
    group_id bigint NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: group_preferences_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.group_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.group_preferences_id_seq OWNED BY template.group_preferences.id;


--
-- Name: groups; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.groups (
    id bigint NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    group_type_id integer
);


--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.groups_id_seq OWNED BY template.groups.id;


--
-- Name: grp_con_avatar_turn_relationships; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.grp_con_avatar_turn_relationships (
    id bigint NOT NULL,
    turn_id bigint NOT NULL,
    target_turn_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    turn_relationship_type_id integer DEFAULT 1 NOT NULL
);


--
-- Name: grp_con_avatar_turn_relationships_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.grp_con_avatar_turn_relationships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatar_turn_relationships_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.grp_con_avatar_turn_relationships_id_seq OWNED BY template.grp_con_avatar_turn_relationships.id;


--
-- Name: grp_con_avatar_turns; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.grp_con_avatar_turns (
    id bigint NOT NULL,
    grp_con_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    turn_index numeric(10,2) NOT NULL,
    content_text text NOT NULL,
    content_vector public.vector(1536),
    created_at timestamp with time zone DEFAULT now(),
    turn_kind_id integer NOT NULL,
    message_type_id integer,
    template_topic_id bigint
);


--
-- Name: grp_con_avatar_turns_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.grp_con_avatar_turns_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatar_turns_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.grp_con_avatar_turns_id_seq OWNED BY template.grp_con_avatar_turns.id;


--
-- Name: grp_con_avatars; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.grp_con_avatars (
    grp_con_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    added_at timestamp with time zone DEFAULT now()
);


--
-- Name: grp_con_avatars_avatar_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.grp_con_avatars_avatar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatars_grp_con_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.grp_con_avatars_grp_con_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_upload_vectors; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.grp_con_upload_vectors (
    id bigint NOT NULL,
    upload_id bigint NOT NULL,
    chunk_index integer NOT NULL,
    content_text text NOT NULL,
    content_vector public.vector(1536),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: grp_con_upload_vectors_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.grp_con_upload_vectors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_upload_vectors_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.grp_con_upload_vectors_id_seq OWNED BY template.grp_con_upload_vectors.id;


--
-- Name: grp_con_uploads; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.grp_con_uploads (
    id bigint NOT NULL,
    grp_con_id bigint NOT NULL,
    turn_id bigint NOT NULL,
    filename text NOT NULL,
    mime_type text,
    file_path text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now(),
    public_url text,
    bucket_name text
);


--
-- Name: grp_con_uploads_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.grp_con_uploads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_uploads_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.grp_con_uploads_id_seq OWNED BY template.grp_con_uploads.id;


--
-- Name: grp_cons; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.grp_cons (
    id bigint NOT NULL,
    group_id bigint,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    type_id integer,
    parent_grp_con_id bigint,
    template_id integer
);


--
-- Name: COLUMN grp_cons.parent_grp_con_id; Type: COMMENT; Schema: template; Owner: -
--

COMMENT ON COLUMN template.grp_cons.parent_grp_con_id IS 'For template instances (type_id=3), references the parent template (type_id=2) this instance was created from';


--
-- Name: grp_cons_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.grp_cons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_cons_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.grp_cons_id_seq OWNED BY template.grp_cons.id;


--
-- Name: grp_template_topics; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.grp_template_topics (
    id integer NOT NULL,
    template_id integer NOT NULL,
    title text NOT NULL,
    content text,
    topic_index numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE grp_template_topics; Type: COMMENT; Schema: template; Owner: -
--

COMMENT ON TABLE template.grp_template_topics IS 'Defines topics for templates';


--
-- Name: grp_template_topics_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.grp_template_topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_template_topics_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.grp_template_topics_id_seq OWNED BY template.grp_template_topics.id;


--
-- Name: grp_templates; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.grp_templates (
    id integer NOT NULL,
    group_id bigint NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by_participant_id bigint
);


--
-- Name: TABLE grp_templates; Type: COMMENT; Schema: template; Owner: -
--

COMMENT ON TABLE template.grp_templates IS 'Defines templates that belong to groups';


--
-- Name: grp_templates_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.grp_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.grp_templates_id_seq OWNED BY template.grp_templates.id;


--
-- Name: participant_avatars; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.participant_avatars (
    id bigint NOT NULL,
    participant_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    created_at date DEFAULT CURRENT_DATE,
    created_by_participant_id bigint
);


--
-- Name: participant_avatars_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.participant_avatars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_avatars_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.participant_avatars_id_seq OWNED BY template.participant_avatars.id;


--
-- Name: participant_event_types; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.participant_event_types (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL
);


--
-- Name: participant_event_types_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.participant_event_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_event_types_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.participant_event_types_id_seq OWNED BY template.participant_event_types.id;


--
-- Name: participant_events; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.participant_events (
    id integer NOT NULL,
    participant_id bigint NOT NULL,
    event_type_id integer NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN participant_events.participant_id; Type: COMMENT; Schema: template; Owner: -
--

COMMENT ON COLUMN template.participant_events.participant_id IS 'The ID of the participant (can be null for events not associated with a specific participant, e.g., login attempts with non-existent emails)';


--
-- Name: participant_events_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.participant_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_events_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.participant_events_id_seq OWNED BY template.participant_events.id;


--
-- Name: participant_groups; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.participant_groups (
    participant_id bigint NOT NULL,
    group_id bigint NOT NULL,
    role text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: participant_groups_group_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.participant_groups_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_groups_participant_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.participant_groups_participant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_llms; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.participant_llms (
    id bigint NOT NULL,
    participant_id bigint NOT NULL,
    llm_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: participant_llms_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.participant_llms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_llms_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.participant_llms_id_seq OWNED BY template.participant_llms.id;


--
-- Name: participant_preferences; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.participant_preferences (
    id integer NOT NULL,
    participant_id bigint NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: participant_preferences_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.participant_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.participant_preferences_id_seq OWNED BY template.participant_preferences.id;


--
-- Name: relationship_types_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.relationship_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_preferences; Type: TABLE; Schema: template; Owner: -
--

CREATE TABLE template.site_preferences (
    id integer NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: site_preferences_id_seq; Type: SEQUENCE; Schema: template; Owner: -
--

CREATE SEQUENCE template.site_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: template; Owner: -
--

ALTER SEQUENCE template.site_preferences_id_seq OWNED BY template.site_preferences.id;


--
-- Name: avatar_event_types; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.avatar_event_types (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL
);


--
-- Name: avatar_event_types_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.avatar_event_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatar_event_types_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.avatar_event_types_id_seq OWNED BY timethatremains.avatar_event_types.id;


--
-- Name: avatar_scopes; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.avatar_scopes (
    id integer NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: avatar_scopes_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.avatar_scopes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatar_scopes_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.avatar_scopes_id_seq OWNED BY timethatremains.avatar_scopes.id;


--
-- Name: avatars; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.avatars (
    id bigint NOT NULL,
    name text NOT NULL,
    instruction_set text,
    created_at timestamp with time zone DEFAULT now(),
    avatar_scope_id integer DEFAULT 1 NOT NULL,
    llm_config jsonb
);


--
-- Name: avatars_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.avatars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatars_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.avatars_id_seq OWNED BY timethatremains.avatars.id;


--
-- Name: file_types; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.file_types (
    id bigint NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: file_types_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.file_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: file_types_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.file_types_id_seq OWNED BY timethatremains.file_types.id;


--
-- Name: group_conversation_avatar_turn_relationships_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.group_conversation_avatar_turn_relationships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatar_turns_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.group_conversation_avatar_turns_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatars_avatar_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.group_conversation_avatars_avatar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatars_group_conversation_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.group_conversation_avatars_group_conversation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_upload_vectors_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.group_conversation_upload_vectors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_uploads_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.group_conversation_uploads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversations_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.group_conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_preferences; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.group_preferences (
    id integer NOT NULL,
    group_id bigint NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: group_preferences_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.group_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.group_preferences_id_seq OWNED BY timethatremains.group_preferences.id;


--
-- Name: groups; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.groups (
    id bigint NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    group_type_id integer
);


--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.groups_id_seq OWNED BY timethatremains.groups.id;


--
-- Name: grp_con_avatar_turn_relationships; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.grp_con_avatar_turn_relationships (
    id bigint NOT NULL,
    turn_id bigint NOT NULL,
    target_turn_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    turn_relationship_type_id integer DEFAULT 1 NOT NULL
);


--
-- Name: grp_con_avatar_turn_relationships_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.grp_con_avatar_turn_relationships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatar_turn_relationships_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.grp_con_avatar_turn_relationships_id_seq OWNED BY timethatremains.grp_con_avatar_turn_relationships.id;


--
-- Name: grp_con_avatar_turns; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.grp_con_avatar_turns (
    id bigint NOT NULL,
    grp_con_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    turn_index numeric(10,2) NOT NULL,
    content_text text NOT NULL,
    content_vector public.vector(1536),
    created_at timestamp with time zone DEFAULT now(),
    turn_kind_id integer NOT NULL,
    message_type_id integer,
    template_topic_id bigint
);


--
-- Name: grp_con_avatar_turns_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.grp_con_avatar_turns_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatar_turns_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.grp_con_avatar_turns_id_seq OWNED BY timethatremains.grp_con_avatar_turns.id;


--
-- Name: grp_con_avatars; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.grp_con_avatars (
    grp_con_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    added_at timestamp with time zone DEFAULT now()
);


--
-- Name: grp_con_avatars_avatar_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.grp_con_avatars_avatar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatars_grp_con_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.grp_con_avatars_grp_con_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_upload_vectors; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.grp_con_upload_vectors (
    id bigint NOT NULL,
    upload_id bigint NOT NULL,
    chunk_index integer NOT NULL,
    content_text text NOT NULL,
    content_vector public.vector(1536),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: grp_con_upload_vectors_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.grp_con_upload_vectors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_upload_vectors_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.grp_con_upload_vectors_id_seq OWNED BY timethatremains.grp_con_upload_vectors.id;


--
-- Name: grp_con_uploads; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.grp_con_uploads (
    id bigint NOT NULL,
    grp_con_id bigint NOT NULL,
    turn_id bigint NOT NULL,
    filename text NOT NULL,
    mime_type text,
    file_path text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now(),
    public_url text,
    bucket_name text
);


--
-- Name: grp_con_uploads_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.grp_con_uploads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_uploads_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.grp_con_uploads_id_seq OWNED BY timethatremains.grp_con_uploads.id;


--
-- Name: grp_cons; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.grp_cons (
    id bigint NOT NULL,
    group_id bigint,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    type_id integer,
    parent_grp_con_id bigint,
    template_id integer
);


--
-- Name: COLUMN grp_cons.parent_grp_con_id; Type: COMMENT; Schema: timethatremains; Owner: -
--

COMMENT ON COLUMN timethatremains.grp_cons.parent_grp_con_id IS 'For template instances (type_id=3), references the parent template (type_id=2) this instance was created from';


--
-- Name: grp_cons_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.grp_cons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_cons_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.grp_cons_id_seq OWNED BY timethatremains.grp_cons.id;


--
-- Name: grp_template_topics; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.grp_template_topics (
    id integer NOT NULL,
    template_id integer NOT NULL,
    title text NOT NULL,
    content text,
    topic_index numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE grp_template_topics; Type: COMMENT; Schema: timethatremains; Owner: -
--

COMMENT ON TABLE timethatremains.grp_template_topics IS 'Defines topics for templates';


--
-- Name: grp_template_topics_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.grp_template_topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_template_topics_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.grp_template_topics_id_seq OWNED BY timethatremains.grp_template_topics.id;


--
-- Name: grp_templates; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.grp_templates (
    id integer NOT NULL,
    group_id bigint NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by_participant_id bigint
);


--
-- Name: TABLE grp_templates; Type: COMMENT; Schema: timethatremains; Owner: -
--

COMMENT ON TABLE timethatremains.grp_templates IS 'Defines templates that belong to groups';


--
-- Name: grp_templates_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.grp_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.grp_templates_id_seq OWNED BY timethatremains.grp_templates.id;


--
-- Name: participant_avatars; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.participant_avatars (
    id bigint NOT NULL,
    participant_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    created_at date DEFAULT CURRENT_DATE,
    created_by_participant_id bigint
);


--
-- Name: participant_avatars_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.participant_avatars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_avatars_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.participant_avatars_id_seq OWNED BY timethatremains.participant_avatars.id;


--
-- Name: participant_event_types; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.participant_event_types (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL
);


--
-- Name: participant_event_types_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.participant_event_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_event_types_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.participant_event_types_id_seq OWNED BY timethatremains.participant_event_types.id;


--
-- Name: participant_events; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.participant_events (
    id integer NOT NULL,
    participant_id bigint NOT NULL,
    event_type_id integer NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN participant_events.participant_id; Type: COMMENT; Schema: timethatremains; Owner: -
--

COMMENT ON COLUMN timethatremains.participant_events.participant_id IS 'The ID of the participant (can be null for events not associated with a specific participant, e.g., login attempts with non-existent emails)';


--
-- Name: participant_events_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.participant_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_events_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.participant_events_id_seq OWNED BY timethatremains.participant_events.id;


--
-- Name: participant_groups; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.participant_groups (
    participant_id bigint NOT NULL,
    group_id bigint NOT NULL,
    role text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: participant_groups_group_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.participant_groups_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_groups_participant_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.participant_groups_participant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_llms; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.participant_llms (
    id bigint NOT NULL,
    participant_id bigint NOT NULL,
    llm_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: participant_llms_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.participant_llms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_llms_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.participant_llms_id_seq OWNED BY timethatremains.participant_llms.id;


--
-- Name: participant_preferences; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.participant_preferences (
    id integer NOT NULL,
    participant_id bigint NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: participant_preferences_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.participant_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.participant_preferences_id_seq OWNED BY timethatremains.participant_preferences.id;


--
-- Name: relationship_types_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.relationship_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_preferences; Type: TABLE; Schema: timethatremains; Owner: -
--

CREATE TABLE timethatremains.site_preferences (
    id integer NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: site_preferences_id_seq; Type: SEQUENCE; Schema: timethatremains; Owner: -
--

CREATE SEQUENCE timethatremains.site_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: timethatremains; Owner: -
--

ALTER SEQUENCE timethatremains.site_preferences_id_seq OWNED BY timethatremains.site_preferences.id;


--
-- Name: avatar_scopes id; Type: DEFAULT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.avatar_scopes ALTER COLUMN id SET DEFAULT nextval('bsa.avatar_scopes_id_seq'::regclass);


--
-- Name: avatars id; Type: DEFAULT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.avatars ALTER COLUMN id SET DEFAULT nextval('bsa.avatars_id_seq'::regclass);


--
-- Name: group_preferences id; Type: DEFAULT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.group_preferences ALTER COLUMN id SET DEFAULT nextval('bsa.group_preferences_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.groups ALTER COLUMN id SET DEFAULT nextval('bsa.groups_id_seq'::regclass);


--
-- Name: grp_con_avatar_turn_relationships id; Type: DEFAULT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_con_avatar_turn_relationships ALTER COLUMN id SET DEFAULT nextval('bsa.grp_con_avatar_turn_relationships_id_seq'::regclass);


--
-- Name: grp_con_avatar_turns id; Type: DEFAULT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_con_avatar_turns ALTER COLUMN id SET DEFAULT nextval('bsa.grp_con_avatar_turns_id_seq'::regclass);


--
-- Name: grp_con_upload_vectors id; Type: DEFAULT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_con_upload_vectors ALTER COLUMN id SET DEFAULT nextval('bsa.grp_con_upload_vectors_id_seq'::regclass);


--
-- Name: grp_con_uploads id; Type: DEFAULT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_con_uploads ALTER COLUMN id SET DEFAULT nextval('bsa.grp_con_uploads_id_seq'::regclass);


--
-- Name: grp_cons id; Type: DEFAULT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_cons ALTER COLUMN id SET DEFAULT nextval('bsa.grp_cons_id_seq'::regclass);


--
-- Name: grp_template_topics id; Type: DEFAULT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_template_topics ALTER COLUMN id SET DEFAULT nextval('bsa.grp_template_topics_id_seq'::regclass);


--
-- Name: grp_templates id; Type: DEFAULT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_templates ALTER COLUMN id SET DEFAULT nextval('bsa.grp_templates_id_seq'::regclass);


--
-- Name: participant_avatars id; Type: DEFAULT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.participant_avatars ALTER COLUMN id SET DEFAULT nextval('bsa.participant_avatars_id_seq'::regclass);


--
-- Name: participant_events id; Type: DEFAULT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.participant_events ALTER COLUMN id SET DEFAULT nextval('bsa.participant_events_id_seq'::regclass);


--
-- Name: participant_llms id; Type: DEFAULT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.participant_llms ALTER COLUMN id SET DEFAULT nextval('bsa.participant_llms_id_seq'::regclass);


--
-- Name: participant_preferences id; Type: DEFAULT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.participant_preferences ALTER COLUMN id SET DEFAULT nextval('bsa.participant_preferences_id_seq'::regclass);


--
-- Name: site_preferences id; Type: DEFAULT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.site_preferences ALTER COLUMN id SET DEFAULT nextval('bsa.site_preferences_id_seq'::regclass);


--
-- Name: avatar_scopes id; Type: DEFAULT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.avatar_scopes ALTER COLUMN id SET DEFAULT nextval('conflict_club.avatar_scopes_id_seq'::regclass);


--
-- Name: avatars id; Type: DEFAULT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.avatars ALTER COLUMN id SET DEFAULT nextval('conflict_club.avatars_id_seq'::regclass);


--
-- Name: group_preferences id; Type: DEFAULT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.group_preferences ALTER COLUMN id SET DEFAULT nextval('conflict_club.group_preferences_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.groups ALTER COLUMN id SET DEFAULT nextval('conflict_club.groups_id_seq'::regclass);


--
-- Name: grp_con_avatar_turn_relationships id; Type: DEFAULT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_con_avatar_turn_relationships ALTER COLUMN id SET DEFAULT nextval('conflict_club.grp_con_avatar_turn_relationships_id_seq'::regclass);


--
-- Name: grp_con_avatar_turns id; Type: DEFAULT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_con_avatar_turns ALTER COLUMN id SET DEFAULT nextval('conflict_club.grp_con_avatar_turns_id_seq'::regclass);


--
-- Name: grp_con_upload_vectors id; Type: DEFAULT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_con_upload_vectors ALTER COLUMN id SET DEFAULT nextval('conflict_club.grp_con_upload_vectors_id_seq'::regclass);


--
-- Name: grp_con_uploads id; Type: DEFAULT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_con_uploads ALTER COLUMN id SET DEFAULT nextval('conflict_club.grp_con_uploads_id_seq'::regclass);


--
-- Name: grp_cons id; Type: DEFAULT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_cons ALTER COLUMN id SET DEFAULT nextval('conflict_club.grp_cons_id_seq'::regclass);


--
-- Name: grp_template_topics id; Type: DEFAULT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_template_topics ALTER COLUMN id SET DEFAULT nextval('conflict_club.grp_template_topics_id_seq'::regclass);


--
-- Name: grp_templates id; Type: DEFAULT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_templates ALTER COLUMN id SET DEFAULT nextval('conflict_club.grp_templates_id_seq'::regclass);


--
-- Name: participant_avatars id; Type: DEFAULT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.participant_avatars ALTER COLUMN id SET DEFAULT nextval('conflict_club.participant_avatars_id_seq'::regclass);


--
-- Name: participant_events id; Type: DEFAULT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.participant_events ALTER COLUMN id SET DEFAULT nextval('conflict_club.participant_events_id_seq'::regclass);


--
-- Name: participant_llms id; Type: DEFAULT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.participant_llms ALTER COLUMN id SET DEFAULT nextval('conflict_club.participant_llms_id_seq'::regclass);


--
-- Name: participant_preferences id; Type: DEFAULT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.participant_preferences ALTER COLUMN id SET DEFAULT nextval('conflict_club.participant_preferences_id_seq'::regclass);


--
-- Name: site_preferences id; Type: DEFAULT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.site_preferences ALTER COLUMN id SET DEFAULT nextval('conflict_club.site_preferences_id_seq'::regclass);


--
-- Name: avatar_event_types id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.avatar_event_types ALTER COLUMN id SET DEFAULT nextval('dev.avatar_event_types_id_seq'::regclass);


--
-- Name: avatar_scopes id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.avatar_scopes ALTER COLUMN id SET DEFAULT nextval('dev.avatar_scopes_id_seq'::regclass);


--
-- Name: avatars id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.avatars ALTER COLUMN id SET DEFAULT nextval('dev.avatars_id_seq'::regclass);


--
-- Name: client_schema_preferences id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.client_schema_preferences ALTER COLUMN id SET DEFAULT nextval('dev.client_schema_preferences_id_seq'::regclass);


--
-- Name: client_schemas id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.client_schemas ALTER COLUMN id SET DEFAULT nextval('dev.client_schemas_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.clients ALTER COLUMN id SET DEFAULT nextval('dev.clients_id_seq'::regclass);


--
-- Name: event_types id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.event_types ALTER COLUMN id SET DEFAULT nextval('dev.event_types_id_seq'::regclass);


--
-- Name: file_types id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.file_types ALTER COLUMN id SET DEFAULT nextval('dev.file_types_id_seq'::regclass);


--
-- Name: group_preferences id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.group_preferences ALTER COLUMN id SET DEFAULT nextval('dev.group_preferences_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.groups ALTER COLUMN id SET DEFAULT nextval('dev.groups_id_seq'::regclass);


--
-- Name: grp_con_avatar_turn_relationships id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_con_avatar_turn_relationships ALTER COLUMN id SET DEFAULT nextval('dev.grp_con_avatar_turn_relationships_id_seq'::regclass);


--
-- Name: grp_con_avatar_turns id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_con_avatar_turns ALTER COLUMN id SET DEFAULT nextval('dev.grp_con_avatar_turns_id_seq'::regclass);


--
-- Name: grp_con_upload_vectors id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_con_upload_vectors ALTER COLUMN id SET DEFAULT nextval('dev.grp_con_upload_vectors_id_seq'::regclass);


--
-- Name: grp_con_uploads id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_con_uploads ALTER COLUMN id SET DEFAULT nextval('dev.grp_con_uploads_id_seq'::regclass);


--
-- Name: grp_cons id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_cons ALTER COLUMN id SET DEFAULT nextval('dev.grp_cons_id_seq'::regclass);


--
-- Name: grp_template_topics id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_template_topics ALTER COLUMN id SET DEFAULT nextval('dev.grp_template_topics_id_seq'::regclass);


--
-- Name: grp_templates id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_templates ALTER COLUMN id SET DEFAULT nextval('dev.grp_templates_id_seq'::regclass);


--
-- Name: participant_avatars id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.participant_avatars ALTER COLUMN id SET DEFAULT nextval('dev.participant_avatars_id_seq'::regclass);


--
-- Name: participant_event_types id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.participant_event_types ALTER COLUMN id SET DEFAULT nextval('dev.participant_event_types_id_seq'::regclass);


--
-- Name: participant_events id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.participant_events ALTER COLUMN id SET DEFAULT nextval('dev.participant_events_id_seq'::regclass);


--
-- Name: participant_llms id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.participant_llms ALTER COLUMN id SET DEFAULT nextval('dev.participant_llms_id_seq'::regclass);


--
-- Name: participant_preferences id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.participant_preferences ALTER COLUMN id SET DEFAULT nextval('dev.participant_preferences_id_seq'::regclass);


--
-- Name: site_preferences id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.site_preferences ALTER COLUMN id SET DEFAULT nextval('dev.site_preferences_id_seq'::regclass);


--
-- Name: topic_paths id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.topic_paths ALTER COLUMN id SET DEFAULT nextval('dev.topic_paths_id_seq'::regclass);


--
-- Name: avatar_scopes id; Type: DEFAULT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.avatar_scopes ALTER COLUMN id SET DEFAULT nextval('first_congregational.avatar_scopes_id_seq'::regclass);


--
-- Name: avatars id; Type: DEFAULT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.avatars ALTER COLUMN id SET DEFAULT nextval('first_congregational.avatars_id_seq'::regclass);


--
-- Name: group_preferences id; Type: DEFAULT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.group_preferences ALTER COLUMN id SET DEFAULT nextval('first_congregational.group_preferences_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.groups ALTER COLUMN id SET DEFAULT nextval('first_congregational.groups_id_seq'::regclass);


--
-- Name: grp_con_avatar_turn_relationships id; Type: DEFAULT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_con_avatar_turn_relationships ALTER COLUMN id SET DEFAULT nextval('first_congregational.grp_con_avatar_turn_relationships_id_seq'::regclass);


--
-- Name: grp_con_avatar_turns id; Type: DEFAULT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_con_avatar_turns ALTER COLUMN id SET DEFAULT nextval('first_congregational.grp_con_avatar_turns_id_seq'::regclass);


--
-- Name: grp_con_upload_vectors id; Type: DEFAULT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_con_upload_vectors ALTER COLUMN id SET DEFAULT nextval('first_congregational.grp_con_upload_vectors_id_seq'::regclass);


--
-- Name: grp_con_uploads id; Type: DEFAULT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_con_uploads ALTER COLUMN id SET DEFAULT nextval('first_congregational.grp_con_uploads_id_seq'::regclass);


--
-- Name: grp_cons id; Type: DEFAULT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_cons ALTER COLUMN id SET DEFAULT nextval('first_congregational.grp_cons_id_seq'::regclass);


--
-- Name: grp_template_topics id; Type: DEFAULT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_template_topics ALTER COLUMN id SET DEFAULT nextval('first_congregational.grp_template_topics_id_seq'::regclass);


--
-- Name: grp_templates id; Type: DEFAULT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_templates ALTER COLUMN id SET DEFAULT nextval('first_congregational.grp_templates_id_seq'::regclass);


--
-- Name: participant_avatars id; Type: DEFAULT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.participant_avatars ALTER COLUMN id SET DEFAULT nextval('first_congregational.participant_avatars_id_seq'::regclass);


--
-- Name: participant_events id; Type: DEFAULT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.participant_events ALTER COLUMN id SET DEFAULT nextval('first_congregational.participant_events_id_seq'::regclass);


--
-- Name: participant_llms id; Type: DEFAULT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.participant_llms ALTER COLUMN id SET DEFAULT nextval('first_congregational.participant_llms_id_seq'::regclass);


--
-- Name: participant_preferences id; Type: DEFAULT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.participant_preferences ALTER COLUMN id SET DEFAULT nextval('first_congregational.participant_preferences_id_seq'::regclass);


--
-- Name: site_preferences id; Type: DEFAULT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.site_preferences ALTER COLUMN id SET DEFAULT nextval('first_congregational.site_preferences_id_seq'::regclass);


--
-- Name: avatar_event_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avatar_event_types ALTER COLUMN id SET DEFAULT nextval('public.avatar_event_types_id_seq'::regclass);


--
-- Name: file_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_types ALTER COLUMN id SET DEFAULT nextval('public.file_types_id_seq'::regclass);


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
-- Name: participant_roles role_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_roles ALTER COLUMN role_id SET DEFAULT nextval('public.participant_roles_role_id_seq'::regclass);


--
-- Name: preference_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preference_types ALTER COLUMN id SET DEFAULT nextval('public.preference_types_id_seq'::regclass);


--
-- Name: turn_kinds id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.turn_kinds ALTER COLUMN id SET DEFAULT nextval('public.turn_kinds_id_seq'::regclass);


--
-- Name: turn_relationship_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.turn_relationship_types ALTER COLUMN id SET DEFAULT nextval('public.turn_relationship_types_id_seq'::regclass);


--
-- Name: avatar_event_types id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.avatar_event_types ALTER COLUMN id SET DEFAULT nextval('template.avatar_event_types_id_seq'::regclass);


--
-- Name: avatar_scopes id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.avatar_scopes ALTER COLUMN id SET DEFAULT nextval('template.avatar_scopes_id_seq'::regclass);


--
-- Name: avatars id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.avatars ALTER COLUMN id SET DEFAULT nextval('template.avatars_id_seq'::regclass);


--
-- Name: file_types id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.file_types ALTER COLUMN id SET DEFAULT nextval('template.file_types_id_seq'::regclass);


--
-- Name: group_preferences id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.group_preferences ALTER COLUMN id SET DEFAULT nextval('template.group_preferences_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.groups ALTER COLUMN id SET DEFAULT nextval('template.groups_id_seq'::regclass);


--
-- Name: grp_con_avatar_turn_relationships id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_con_avatar_turn_relationships ALTER COLUMN id SET DEFAULT nextval('template.grp_con_avatar_turn_relationships_id_seq'::regclass);


--
-- Name: grp_con_avatar_turns id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_con_avatar_turns ALTER COLUMN id SET DEFAULT nextval('template.grp_con_avatar_turns_id_seq'::regclass);


--
-- Name: grp_con_upload_vectors id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_con_upload_vectors ALTER COLUMN id SET DEFAULT nextval('template.grp_con_upload_vectors_id_seq'::regclass);


--
-- Name: grp_con_uploads id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_con_uploads ALTER COLUMN id SET DEFAULT nextval('template.grp_con_uploads_id_seq'::regclass);


--
-- Name: grp_cons id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_cons ALTER COLUMN id SET DEFAULT nextval('template.grp_cons_id_seq'::regclass);


--
-- Name: grp_template_topics id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_template_topics ALTER COLUMN id SET DEFAULT nextval('template.grp_template_topics_id_seq'::regclass);


--
-- Name: grp_templates id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_templates ALTER COLUMN id SET DEFAULT nextval('template.grp_templates_id_seq'::regclass);


--
-- Name: participant_avatars id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.participant_avatars ALTER COLUMN id SET DEFAULT nextval('template.participant_avatars_id_seq'::regclass);


--
-- Name: participant_event_types id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.participant_event_types ALTER COLUMN id SET DEFAULT nextval('template.participant_event_types_id_seq'::regclass);


--
-- Name: participant_events id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.participant_events ALTER COLUMN id SET DEFAULT nextval('template.participant_events_id_seq'::regclass);


--
-- Name: participant_llms id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.participant_llms ALTER COLUMN id SET DEFAULT nextval('template.participant_llms_id_seq'::regclass);


--
-- Name: participant_preferences id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.participant_preferences ALTER COLUMN id SET DEFAULT nextval('template.participant_preferences_id_seq'::regclass);


--
-- Name: site_preferences id; Type: DEFAULT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.site_preferences ALTER COLUMN id SET DEFAULT nextval('template.site_preferences_id_seq'::regclass);


--
-- Name: avatar_event_types id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.avatar_event_types ALTER COLUMN id SET DEFAULT nextval('timethatremains.avatar_event_types_id_seq'::regclass);


--
-- Name: avatar_scopes id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.avatar_scopes ALTER COLUMN id SET DEFAULT nextval('timethatremains.avatar_scopes_id_seq'::regclass);


--
-- Name: avatars id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.avatars ALTER COLUMN id SET DEFAULT nextval('timethatremains.avatars_id_seq'::regclass);


--
-- Name: file_types id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.file_types ALTER COLUMN id SET DEFAULT nextval('timethatremains.file_types_id_seq'::regclass);


--
-- Name: group_preferences id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.group_preferences ALTER COLUMN id SET DEFAULT nextval('timethatremains.group_preferences_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.groups ALTER COLUMN id SET DEFAULT nextval('timethatremains.groups_id_seq'::regclass);


--
-- Name: grp_con_avatar_turn_relationships id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_con_avatar_turn_relationships ALTER COLUMN id SET DEFAULT nextval('timethatremains.grp_con_avatar_turn_relationships_id_seq'::regclass);


--
-- Name: grp_con_avatar_turns id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_con_avatar_turns ALTER COLUMN id SET DEFAULT nextval('timethatremains.grp_con_avatar_turns_id_seq'::regclass);


--
-- Name: grp_con_upload_vectors id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_con_upload_vectors ALTER COLUMN id SET DEFAULT nextval('timethatremains.grp_con_upload_vectors_id_seq'::regclass);


--
-- Name: grp_con_uploads id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_con_uploads ALTER COLUMN id SET DEFAULT nextval('timethatremains.grp_con_uploads_id_seq'::regclass);


--
-- Name: grp_cons id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_cons ALTER COLUMN id SET DEFAULT nextval('timethatremains.grp_cons_id_seq'::regclass);


--
-- Name: grp_template_topics id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_template_topics ALTER COLUMN id SET DEFAULT nextval('timethatremains.grp_template_topics_id_seq'::regclass);


--
-- Name: grp_templates id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_templates ALTER COLUMN id SET DEFAULT nextval('timethatremains.grp_templates_id_seq'::regclass);


--
-- Name: participant_avatars id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.participant_avatars ALTER COLUMN id SET DEFAULT nextval('timethatremains.participant_avatars_id_seq'::regclass);


--
-- Name: participant_event_types id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.participant_event_types ALTER COLUMN id SET DEFAULT nextval('timethatremains.participant_event_types_id_seq'::regclass);


--
-- Name: participant_events id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.participant_events ALTER COLUMN id SET DEFAULT nextval('timethatremains.participant_events_id_seq'::regclass);


--
-- Name: participant_llms id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.participant_llms ALTER COLUMN id SET DEFAULT nextval('timethatremains.participant_llms_id_seq'::regclass);


--
-- Name: participant_preferences id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.participant_preferences ALTER COLUMN id SET DEFAULT nextval('timethatremains.participant_preferences_id_seq'::regclass);


--
-- Name: site_preferences id; Type: DEFAULT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.site_preferences ALTER COLUMN id SET DEFAULT nextval('timethatremains.site_preferences_id_seq'::regclass);


--
-- Name: avatar_scopes avatar_scopes_name_key; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.avatar_scopes
    ADD CONSTRAINT avatar_scopes_name_key UNIQUE (name);


--
-- Name: avatar_scopes avatar_scopes_pkey; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.avatar_scopes
    ADD CONSTRAINT avatar_scopes_pkey PRIMARY KEY (id);


--
-- Name: avatars avatars_name_key; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.avatars
    ADD CONSTRAINT avatars_name_key UNIQUE (name);


--
-- Name: avatars avatars_pkey; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.avatars
    ADD CONSTRAINT avatars_pkey PRIMARY KEY (id);


--
-- Name: group_preferences group_preferences_group_id_preference_type_id_key; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.group_preferences
    ADD CONSTRAINT group_preferences_group_id_preference_type_id_key UNIQUE (group_id, preference_type_id);


--
-- Name: group_preferences group_preferences_pkey; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.group_preferences
    ADD CONSTRAINT group_preferences_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: grp_con_avatar_turn_relationships grp_con_avatar_turn_relationships_pkey; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_con_avatar_turn_relationships
    ADD CONSTRAINT grp_con_avatar_turn_relationships_pkey PRIMARY KEY (id);


--
-- Name: grp_con_avatar_turns grp_con_avatar_turns_pkey; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_con_avatar_turns
    ADD CONSTRAINT grp_con_avatar_turns_pkey PRIMARY KEY (id);


--
-- Name: grp_con_avatars grp_con_avatars_pkey; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_con_avatars
    ADD CONSTRAINT grp_con_avatars_pkey PRIMARY KEY (grp_con_id, avatar_id);


--
-- Name: grp_con_upload_vectors grp_con_upload_vectors_pkey; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_con_upload_vectors
    ADD CONSTRAINT grp_con_upload_vectors_pkey PRIMARY KEY (id);


--
-- Name: grp_con_uploads grp_con_uploads_pkey; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_con_uploads
    ADD CONSTRAINT grp_con_uploads_pkey PRIMARY KEY (id);


--
-- Name: grp_cons grp_cons_pkey; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_cons
    ADD CONSTRAINT grp_cons_pkey PRIMARY KEY (id);


--
-- Name: grp_template_topics grp_template_topics_pkey; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_template_topics
    ADD CONSTRAINT grp_template_topics_pkey PRIMARY KEY (id);


--
-- Name: grp_templates grp_templates_pkey; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_templates
    ADD CONSTRAINT grp_templates_pkey PRIMARY KEY (id);


--
-- Name: participant_avatars participant_avatars_pkey; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.participant_avatars
    ADD CONSTRAINT participant_avatars_pkey PRIMARY KEY (id);


--
-- Name: participant_events participant_events_pkey; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.participant_events
    ADD CONSTRAINT participant_events_pkey PRIMARY KEY (id);


--
-- Name: participant_groups participant_groups_pkey; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.participant_groups
    ADD CONSTRAINT participant_groups_pkey PRIMARY KEY (participant_id, group_id);


--
-- Name: participant_llms participant_llms_participant_id_llm_id_key; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.participant_llms
    ADD CONSTRAINT participant_llms_participant_id_llm_id_key UNIQUE (participant_id, llm_id);


--
-- Name: participant_llms participant_llms_pkey; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.participant_llms
    ADD CONSTRAINT participant_llms_pkey PRIMARY KEY (id);


--
-- Name: participant_preferences participant_preferences_participant_id_preference_type_id_key; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.participant_preferences
    ADD CONSTRAINT participant_preferences_participant_id_preference_type_id_key UNIQUE (participant_id, preference_type_id);


--
-- Name: participant_preferences participant_preferences_pkey; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.participant_preferences
    ADD CONSTRAINT participant_preferences_pkey PRIMARY KEY (id);


--
-- Name: site_preferences site_preferences_pkey; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.site_preferences
    ADD CONSTRAINT site_preferences_pkey PRIMARY KEY (id);


--
-- Name: site_preferences site_preferences_preference_type_id_key; Type: CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.site_preferences
    ADD CONSTRAINT site_preferences_preference_type_id_key UNIQUE (preference_type_id);


--
-- Name: avatar_scopes avatar_scopes_name_key; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.avatar_scopes
    ADD CONSTRAINT avatar_scopes_name_key UNIQUE (name);


--
-- Name: avatar_scopes avatar_scopes_pkey; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.avatar_scopes
    ADD CONSTRAINT avatar_scopes_pkey PRIMARY KEY (id);


--
-- Name: avatars avatars_name_key; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.avatars
    ADD CONSTRAINT avatars_name_key UNIQUE (name);


--
-- Name: avatars avatars_pkey; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.avatars
    ADD CONSTRAINT avatars_pkey PRIMARY KEY (id);


--
-- Name: group_preferences group_preferences_group_id_preference_type_id_key; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.group_preferences
    ADD CONSTRAINT group_preferences_group_id_preference_type_id_key UNIQUE (group_id, preference_type_id);


--
-- Name: group_preferences group_preferences_pkey; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.group_preferences
    ADD CONSTRAINT group_preferences_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: grp_con_avatar_turn_relationships grp_con_avatar_turn_relationships_pkey; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_con_avatar_turn_relationships
    ADD CONSTRAINT grp_con_avatar_turn_relationships_pkey PRIMARY KEY (id);


--
-- Name: grp_con_avatar_turns grp_con_avatar_turns_pkey; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_con_avatar_turns
    ADD CONSTRAINT grp_con_avatar_turns_pkey PRIMARY KEY (id);


--
-- Name: grp_con_avatars grp_con_avatars_pkey; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_con_avatars
    ADD CONSTRAINT grp_con_avatars_pkey PRIMARY KEY (grp_con_id, avatar_id);


--
-- Name: grp_con_upload_vectors grp_con_upload_vectors_pkey; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_con_upload_vectors
    ADD CONSTRAINT grp_con_upload_vectors_pkey PRIMARY KEY (id);


--
-- Name: grp_con_uploads grp_con_uploads_pkey; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_con_uploads
    ADD CONSTRAINT grp_con_uploads_pkey PRIMARY KEY (id);


--
-- Name: grp_cons grp_cons_pkey; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_cons
    ADD CONSTRAINT grp_cons_pkey PRIMARY KEY (id);


--
-- Name: grp_template_topics grp_template_topics_pkey; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_template_topics
    ADD CONSTRAINT grp_template_topics_pkey PRIMARY KEY (id);


--
-- Name: grp_templates grp_templates_pkey; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_templates
    ADD CONSTRAINT grp_templates_pkey PRIMARY KEY (id);


--
-- Name: participant_avatars participant_avatars_pkey; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.participant_avatars
    ADD CONSTRAINT participant_avatars_pkey PRIMARY KEY (id);


--
-- Name: participant_events participant_events_pkey; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.participant_events
    ADD CONSTRAINT participant_events_pkey PRIMARY KEY (id);


--
-- Name: participant_groups participant_groups_pkey; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.participant_groups
    ADD CONSTRAINT participant_groups_pkey PRIMARY KEY (participant_id, group_id);


--
-- Name: participant_llms participant_llms_participant_id_llm_id_key; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.participant_llms
    ADD CONSTRAINT participant_llms_participant_id_llm_id_key UNIQUE (participant_id, llm_id);


--
-- Name: participant_llms participant_llms_pkey; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.participant_llms
    ADD CONSTRAINT participant_llms_pkey PRIMARY KEY (id);


--
-- Name: participant_preferences participant_preferences_participant_id_preference_type_id_key; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.participant_preferences
    ADD CONSTRAINT participant_preferences_participant_id_preference_type_id_key UNIQUE (participant_id, preference_type_id);


--
-- Name: participant_preferences participant_preferences_pkey; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.participant_preferences
    ADD CONSTRAINT participant_preferences_pkey PRIMARY KEY (id);


--
-- Name: site_preferences site_preferences_pkey; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.site_preferences
    ADD CONSTRAINT site_preferences_pkey PRIMARY KEY (id);


--
-- Name: site_preferences site_preferences_preference_type_id_key; Type: CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.site_preferences
    ADD CONSTRAINT site_preferences_preference_type_id_key UNIQUE (preference_type_id);


--
-- Name: avatar_event_types avatar_event_types_name_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.avatar_event_types
    ADD CONSTRAINT avatar_event_types_name_key UNIQUE (name);


--
-- Name: avatar_event_types avatar_event_types_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.avatar_event_types
    ADD CONSTRAINT avatar_event_types_pkey PRIMARY KEY (id);


--
-- Name: avatar_scopes avatar_scopes_name_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.avatar_scopes
    ADD CONSTRAINT avatar_scopes_name_key UNIQUE (name);


--
-- Name: avatar_scopes avatar_scopes_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.avatar_scopes
    ADD CONSTRAINT avatar_scopes_pkey PRIMARY KEY (id);


--
-- Name: avatars avatars_name_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.avatars
    ADD CONSTRAINT avatars_name_key UNIQUE (name);


--
-- Name: avatars avatars_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.avatars
    ADD CONSTRAINT avatars_pkey PRIMARY KEY (id);


--
-- Name: client_schema_preferences client_schema_preferences_client_schema_id_preference_type__key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.client_schema_preferences
    ADD CONSTRAINT client_schema_preferences_client_schema_id_preference_type__key UNIQUE (client_schema_id, preference_type_id);


--
-- Name: client_schema_preferences client_schema_preferences_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.client_schema_preferences
    ADD CONSTRAINT client_schema_preferences_pkey PRIMARY KEY (id);


--
-- Name: client_schemas client_schemas_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.client_schemas
    ADD CONSTRAINT client_schemas_pkey PRIMARY KEY (id);


--
-- Name: client_schemas client_schemas_schema_name_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.client_schemas
    ADD CONSTRAINT client_schemas_schema_name_key UNIQUE (schema_name);


--
-- Name: clients clients_name_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.clients
    ADD CONSTRAINT clients_name_key UNIQUE (name);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: event_types event_types_name_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.event_types
    ADD CONSTRAINT event_types_name_key UNIQUE (name);


--
-- Name: event_types event_types_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.event_types
    ADD CONSTRAINT event_types_pkey PRIMARY KEY (id);


--
-- Name: file_types file_types_name_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.file_types
    ADD CONSTRAINT file_types_name_key UNIQUE (name);


--
-- Name: file_types file_types_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.file_types
    ADD CONSTRAINT file_types_pkey PRIMARY KEY (id);


--
-- Name: group_preferences group_preferences_group_id_preference_type_id_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.group_preferences
    ADD CONSTRAINT group_preferences_group_id_preference_type_id_key UNIQUE (group_id, preference_type_id);


--
-- Name: group_preferences group_preferences_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.group_preferences
    ADD CONSTRAINT group_preferences_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: grp_con_avatar_turn_relationships grp_con_avatar_turn_relationships_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_con_avatar_turn_relationships
    ADD CONSTRAINT grp_con_avatar_turn_relationships_pkey PRIMARY KEY (id);


--
-- Name: grp_con_avatar_turns grp_con_avatar_turns_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_con_avatar_turns
    ADD CONSTRAINT grp_con_avatar_turns_pkey PRIMARY KEY (id);


--
-- Name: grp_con_avatars grp_con_avatars_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_con_avatars
    ADD CONSTRAINT grp_con_avatars_pkey PRIMARY KEY (grp_con_id, avatar_id);


--
-- Name: grp_con_upload_vectors grp_con_upload_vectors_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_con_upload_vectors
    ADD CONSTRAINT grp_con_upload_vectors_pkey PRIMARY KEY (id);


--
-- Name: grp_con_uploads grp_con_uploads_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_con_uploads
    ADD CONSTRAINT grp_con_uploads_pkey PRIMARY KEY (id);


--
-- Name: grp_cons grp_cons_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_cons
    ADD CONSTRAINT grp_cons_pkey PRIMARY KEY (id);


--
-- Name: grp_template_topics grp_template_topics_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_template_topics
    ADD CONSTRAINT grp_template_topics_pkey PRIMARY KEY (id);


--
-- Name: grp_templates grp_templates_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_templates
    ADD CONSTRAINT grp_templates_pkey PRIMARY KEY (id);


--
-- Name: participant_avatars participant_avatars_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.participant_avatars
    ADD CONSTRAINT participant_avatars_pkey PRIMARY KEY (id);


--
-- Name: participant_event_types participant_event_types_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.participant_event_types
    ADD CONSTRAINT participant_event_types_pkey PRIMARY KEY (id);


--
-- Name: participant_events participant_events_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.participant_events
    ADD CONSTRAINT participant_events_pkey PRIMARY KEY (id);


--
-- Name: participant_groups participant_groups_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.participant_groups
    ADD CONSTRAINT participant_groups_pkey PRIMARY KEY (participant_id, group_id);


--
-- Name: participant_llms participant_llms_participant_id_llm_id_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.participant_llms
    ADD CONSTRAINT participant_llms_participant_id_llm_id_key UNIQUE (participant_id, llm_id);


--
-- Name: participant_llms participant_llms_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.participant_llms
    ADD CONSTRAINT participant_llms_pkey PRIMARY KEY (id);


--
-- Name: participant_preferences participant_preferences_participant_id_preference_type_id_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.participant_preferences
    ADD CONSTRAINT participant_preferences_participant_id_preference_type_id_key UNIQUE (participant_id, preference_type_id);


--
-- Name: participant_preferences participant_preferences_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.participant_preferences
    ADD CONSTRAINT participant_preferences_pkey PRIMARY KEY (id);


--
-- Name: site_preferences site_preferences_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.site_preferences
    ADD CONSTRAINT site_preferences_pkey PRIMARY KEY (id);


--
-- Name: site_preferences site_preferences_preference_type_id_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.site_preferences
    ADD CONSTRAINT site_preferences_preference_type_id_key UNIQUE (preference_type_id);


--
-- Name: topic_paths topic_paths_path_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.topic_paths
    ADD CONSTRAINT topic_paths_path_key UNIQUE (path);


--
-- Name: topic_paths topic_paths_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.topic_paths
    ADD CONSTRAINT topic_paths_pkey PRIMARY KEY (id);


--
-- Name: avatar_scopes avatar_scopes_name_key; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.avatar_scopes
    ADD CONSTRAINT avatar_scopes_name_key UNIQUE (name);


--
-- Name: avatar_scopes avatar_scopes_pkey; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.avatar_scopes
    ADD CONSTRAINT avatar_scopes_pkey PRIMARY KEY (id);


--
-- Name: avatars avatars_name_key; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.avatars
    ADD CONSTRAINT avatars_name_key UNIQUE (name);


--
-- Name: avatars avatars_pkey; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.avatars
    ADD CONSTRAINT avatars_pkey PRIMARY KEY (id);


--
-- Name: group_preferences group_preferences_group_id_preference_type_id_key; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.group_preferences
    ADD CONSTRAINT group_preferences_group_id_preference_type_id_key UNIQUE (group_id, preference_type_id);


--
-- Name: group_preferences group_preferences_pkey; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.group_preferences
    ADD CONSTRAINT group_preferences_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: grp_con_avatar_turn_relationships grp_con_avatar_turn_relationships_pkey; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_con_avatar_turn_relationships
    ADD CONSTRAINT grp_con_avatar_turn_relationships_pkey PRIMARY KEY (id);


--
-- Name: grp_con_avatar_turns grp_con_avatar_turns_pkey; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_con_avatar_turns
    ADD CONSTRAINT grp_con_avatar_turns_pkey PRIMARY KEY (id);


--
-- Name: grp_con_avatars grp_con_avatars_pkey; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_con_avatars
    ADD CONSTRAINT grp_con_avatars_pkey PRIMARY KEY (grp_con_id, avatar_id);


--
-- Name: grp_con_upload_vectors grp_con_upload_vectors_pkey; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_con_upload_vectors
    ADD CONSTRAINT grp_con_upload_vectors_pkey PRIMARY KEY (id);


--
-- Name: grp_con_uploads grp_con_uploads_pkey; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_con_uploads
    ADD CONSTRAINT grp_con_uploads_pkey PRIMARY KEY (id);


--
-- Name: grp_cons grp_cons_pkey; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_cons
    ADD CONSTRAINT grp_cons_pkey PRIMARY KEY (id);


--
-- Name: grp_template_topics grp_template_topics_pkey; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_template_topics
    ADD CONSTRAINT grp_template_topics_pkey PRIMARY KEY (id);


--
-- Name: grp_templates grp_templates_pkey; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_templates
    ADD CONSTRAINT grp_templates_pkey PRIMARY KEY (id);


--
-- Name: participant_avatars participant_avatars_pkey; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.participant_avatars
    ADD CONSTRAINT participant_avatars_pkey PRIMARY KEY (id);


--
-- Name: participant_events participant_events_pkey; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.participant_events
    ADD CONSTRAINT participant_events_pkey PRIMARY KEY (id);


--
-- Name: participant_groups participant_groups_pkey; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.participant_groups
    ADD CONSTRAINT participant_groups_pkey PRIMARY KEY (participant_id, group_id);


--
-- Name: participant_llms participant_llms_participant_id_llm_id_key; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.participant_llms
    ADD CONSTRAINT participant_llms_participant_id_llm_id_key UNIQUE (participant_id, llm_id);


--
-- Name: participant_llms participant_llms_pkey; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.participant_llms
    ADD CONSTRAINT participant_llms_pkey PRIMARY KEY (id);


--
-- Name: participant_preferences participant_preferences_participant_id_preference_type_id_key; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.participant_preferences
    ADD CONSTRAINT participant_preferences_participant_id_preference_type_id_key UNIQUE (participant_id, preference_type_id);


--
-- Name: participant_preferences participant_preferences_pkey; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.participant_preferences
    ADD CONSTRAINT participant_preferences_pkey PRIMARY KEY (id);


--
-- Name: site_preferences site_preferences_pkey; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.site_preferences
    ADD CONSTRAINT site_preferences_pkey PRIMARY KEY (id);


--
-- Name: site_preferences site_preferences_preference_type_id_key; Type: CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.site_preferences
    ADD CONSTRAINT site_preferences_preference_type_id_key UNIQUE (preference_type_id);


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
-- Name: avatar_event_types avatar_event_types_name_key; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.avatar_event_types
    ADD CONSTRAINT avatar_event_types_name_key UNIQUE (name);


--
-- Name: avatar_event_types avatar_event_types_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.avatar_event_types
    ADD CONSTRAINT avatar_event_types_pkey PRIMARY KEY (id);


--
-- Name: avatar_scopes avatar_scopes_name_key; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.avatar_scopes
    ADD CONSTRAINT avatar_scopes_name_key UNIQUE (name);


--
-- Name: avatar_scopes avatar_scopes_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.avatar_scopes
    ADD CONSTRAINT avatar_scopes_pkey PRIMARY KEY (id);


--
-- Name: avatars avatars_name_key; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.avatars
    ADD CONSTRAINT avatars_name_key UNIQUE (name);


--
-- Name: avatars avatars_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.avatars
    ADD CONSTRAINT avatars_pkey PRIMARY KEY (id);


--
-- Name: file_types file_types_name_key; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.file_types
    ADD CONSTRAINT file_types_name_key UNIQUE (name);


--
-- Name: file_types file_types_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.file_types
    ADD CONSTRAINT file_types_pkey PRIMARY KEY (id);


--
-- Name: group_preferences group_preferences_group_id_preference_type_id_key; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.group_preferences
    ADD CONSTRAINT group_preferences_group_id_preference_type_id_key UNIQUE (group_id, preference_type_id);


--
-- Name: group_preferences group_preferences_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.group_preferences
    ADD CONSTRAINT group_preferences_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: grp_con_avatar_turn_relationships grp_con_avatar_turn_relationships_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_con_avatar_turn_relationships
    ADD CONSTRAINT grp_con_avatar_turn_relationships_pkey PRIMARY KEY (id);


--
-- Name: grp_con_avatar_turns grp_con_avatar_turns_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_con_avatar_turns
    ADD CONSTRAINT grp_con_avatar_turns_pkey PRIMARY KEY (id);


--
-- Name: grp_con_avatars grp_con_avatars_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_con_avatars
    ADD CONSTRAINT grp_con_avatars_pkey PRIMARY KEY (grp_con_id, avatar_id);


--
-- Name: grp_con_upload_vectors grp_con_upload_vectors_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_con_upload_vectors
    ADD CONSTRAINT grp_con_upload_vectors_pkey PRIMARY KEY (id);


--
-- Name: grp_con_uploads grp_con_uploads_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_con_uploads
    ADD CONSTRAINT grp_con_uploads_pkey PRIMARY KEY (id);


--
-- Name: grp_cons grp_cons_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_cons
    ADD CONSTRAINT grp_cons_pkey PRIMARY KEY (id);


--
-- Name: grp_template_topics grp_template_topics_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_template_topics
    ADD CONSTRAINT grp_template_topics_pkey PRIMARY KEY (id);


--
-- Name: grp_templates grp_templates_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_templates
    ADD CONSTRAINT grp_templates_pkey PRIMARY KEY (id);


--
-- Name: participant_avatars participant_avatars_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.participant_avatars
    ADD CONSTRAINT participant_avatars_pkey PRIMARY KEY (id);


--
-- Name: participant_event_types participant_event_types_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.participant_event_types
    ADD CONSTRAINT participant_event_types_pkey PRIMARY KEY (id);


--
-- Name: participant_events participant_events_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.participant_events
    ADD CONSTRAINT participant_events_pkey PRIMARY KEY (id);


--
-- Name: participant_groups participant_groups_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.participant_groups
    ADD CONSTRAINT participant_groups_pkey PRIMARY KEY (participant_id, group_id);


--
-- Name: participant_llms participant_llms_participant_id_llm_id_key; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.participant_llms
    ADD CONSTRAINT participant_llms_participant_id_llm_id_key UNIQUE (participant_id, llm_id);


--
-- Name: participant_llms participant_llms_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.participant_llms
    ADD CONSTRAINT participant_llms_pkey PRIMARY KEY (id);


--
-- Name: participant_preferences participant_preferences_participant_id_preference_type_id_key; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.participant_preferences
    ADD CONSTRAINT participant_preferences_participant_id_preference_type_id_key UNIQUE (participant_id, preference_type_id);


--
-- Name: participant_preferences participant_preferences_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.participant_preferences
    ADD CONSTRAINT participant_preferences_pkey PRIMARY KEY (id);


--
-- Name: site_preferences site_preferences_pkey; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.site_preferences
    ADD CONSTRAINT site_preferences_pkey PRIMARY KEY (id);


--
-- Name: site_preferences site_preferences_preference_type_id_key; Type: CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.site_preferences
    ADD CONSTRAINT site_preferences_preference_type_id_key UNIQUE (preference_type_id);


--
-- Name: avatar_event_types avatar_event_types_name_key; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.avatar_event_types
    ADD CONSTRAINT avatar_event_types_name_key UNIQUE (name);


--
-- Name: avatar_event_types avatar_event_types_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.avatar_event_types
    ADD CONSTRAINT avatar_event_types_pkey PRIMARY KEY (id);


--
-- Name: avatar_scopes avatar_scopes_name_key; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.avatar_scopes
    ADD CONSTRAINT avatar_scopes_name_key UNIQUE (name);


--
-- Name: avatar_scopes avatar_scopes_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.avatar_scopes
    ADD CONSTRAINT avatar_scopes_pkey PRIMARY KEY (id);


--
-- Name: avatars avatars_name_key; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.avatars
    ADD CONSTRAINT avatars_name_key UNIQUE (name);


--
-- Name: avatars avatars_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.avatars
    ADD CONSTRAINT avatars_pkey PRIMARY KEY (id);


--
-- Name: file_types file_types_name_key; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.file_types
    ADD CONSTRAINT file_types_name_key UNIQUE (name);


--
-- Name: file_types file_types_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.file_types
    ADD CONSTRAINT file_types_pkey PRIMARY KEY (id);


--
-- Name: group_preferences group_preferences_group_id_preference_type_id_key; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.group_preferences
    ADD CONSTRAINT group_preferences_group_id_preference_type_id_key UNIQUE (group_id, preference_type_id);


--
-- Name: group_preferences group_preferences_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.group_preferences
    ADD CONSTRAINT group_preferences_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: grp_con_avatar_turn_relationships grp_con_avatar_turn_relationships_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_con_avatar_turn_relationships
    ADD CONSTRAINT grp_con_avatar_turn_relationships_pkey PRIMARY KEY (id);


--
-- Name: grp_con_avatar_turns grp_con_avatar_turns_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_con_avatar_turns
    ADD CONSTRAINT grp_con_avatar_turns_pkey PRIMARY KEY (id);


--
-- Name: grp_con_avatars grp_con_avatars_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_con_avatars
    ADD CONSTRAINT grp_con_avatars_pkey PRIMARY KEY (grp_con_id, avatar_id);


--
-- Name: grp_con_upload_vectors grp_con_upload_vectors_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_con_upload_vectors
    ADD CONSTRAINT grp_con_upload_vectors_pkey PRIMARY KEY (id);


--
-- Name: grp_con_uploads grp_con_uploads_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_con_uploads
    ADD CONSTRAINT grp_con_uploads_pkey PRIMARY KEY (id);


--
-- Name: grp_cons grp_cons_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_cons
    ADD CONSTRAINT grp_cons_pkey PRIMARY KEY (id);


--
-- Name: grp_template_topics grp_template_topics_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_template_topics
    ADD CONSTRAINT grp_template_topics_pkey PRIMARY KEY (id);


--
-- Name: grp_templates grp_templates_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_templates
    ADD CONSTRAINT grp_templates_pkey PRIMARY KEY (id);


--
-- Name: participant_avatars participant_avatars_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.participant_avatars
    ADD CONSTRAINT participant_avatars_pkey PRIMARY KEY (id);


--
-- Name: participant_event_types participant_event_types_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.participant_event_types
    ADD CONSTRAINT participant_event_types_pkey PRIMARY KEY (id);


--
-- Name: participant_events participant_events_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.participant_events
    ADD CONSTRAINT participant_events_pkey PRIMARY KEY (id);


--
-- Name: participant_groups participant_groups_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.participant_groups
    ADD CONSTRAINT participant_groups_pkey PRIMARY KEY (participant_id, group_id);


--
-- Name: participant_llms participant_llms_participant_id_llm_id_key; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.participant_llms
    ADD CONSTRAINT participant_llms_participant_id_llm_id_key UNIQUE (participant_id, llm_id);


--
-- Name: participant_llms participant_llms_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.participant_llms
    ADD CONSTRAINT participant_llms_pkey PRIMARY KEY (id);


--
-- Name: participant_preferences participant_preferences_participant_id_preference_type_id_key; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.participant_preferences
    ADD CONSTRAINT participant_preferences_participant_id_preference_type_id_key UNIQUE (participant_id, preference_type_id);


--
-- Name: participant_preferences participant_preferences_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.participant_preferences
    ADD CONSTRAINT participant_preferences_pkey PRIMARY KEY (id);


--
-- Name: site_preferences site_preferences_pkey; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.site_preferences
    ADD CONSTRAINT site_preferences_pkey PRIMARY KEY (id);


--
-- Name: site_preferences site_preferences_preference_type_id_key; Type: CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.site_preferences
    ADD CONSTRAINT site_preferences_preference_type_id_key UNIQUE (preference_type_id);


--
-- Name: grp_con_avatar_turn_relationships_target_turn_id_idx; Type: INDEX; Schema: bsa; Owner: -
--

CREATE INDEX grp_con_avatar_turn_relationships_target_turn_id_idx ON bsa.grp_con_avatar_turn_relationships USING btree (target_turn_id);


--
-- Name: idx_bsa_grp_con_avatar_turns_template_topic_id; Type: INDEX; Schema: bsa; Owner: -
--

CREATE INDEX idx_bsa_grp_con_avatar_turns_template_topic_id ON bsa.grp_con_avatar_turns USING btree (template_topic_id);


--
-- Name: idx_bsa_grp_cons_template_id; Type: INDEX; Schema: bsa; Owner: -
--

CREATE INDEX idx_bsa_grp_cons_template_id ON bsa.grp_cons USING btree (template_id);


--
-- Name: idx_bsa_grp_template_topics_template_id; Type: INDEX; Schema: bsa; Owner: -
--

CREATE INDEX idx_bsa_grp_template_topics_template_id ON bsa.grp_template_topics USING btree (template_id);


--
-- Name: idx_bsa_grp_template_topics_topic_index; Type: INDEX; Schema: bsa; Owner: -
--

CREATE INDEX idx_bsa_grp_template_topics_topic_index ON bsa.grp_template_topics USING btree (topic_index);


--
-- Name: idx_bsa_grp_templates_group_id; Type: INDEX; Schema: bsa; Owner: -
--

CREATE INDEX idx_bsa_grp_templates_group_id ON bsa.grp_templates USING btree (group_id);


--
-- Name: idx_bsa_grp_templates_participant_id; Type: INDEX; Schema: bsa; Owner: -
--

CREATE INDEX idx_bsa_grp_templates_participant_id ON bsa.grp_templates USING btree (created_by_participant_id);


--
-- Name: idx_grp_con_avatar_turns_message_type_id; Type: INDEX; Schema: bsa; Owner: -
--

CREATE INDEX idx_grp_con_avatar_turns_message_type_id ON bsa.grp_con_avatar_turns USING btree (message_type_id);


--
-- Name: idx_grp_cons_parent_id; Type: INDEX; Schema: bsa; Owner: -
--

CREATE INDEX idx_grp_cons_parent_id ON bsa.grp_cons USING btree (parent_grp_con_id);


--
-- Name: idx_grp_cons_type_id; Type: INDEX; Schema: bsa; Owner: -
--

CREATE INDEX idx_grp_cons_type_id ON bsa.grp_cons USING btree (type_id);


--
-- Name: grp_con_avatar_turn_relationships_target_turn_id_idx; Type: INDEX; Schema: conflict_club; Owner: -
--

CREATE INDEX grp_con_avatar_turn_relationships_target_turn_id_idx ON conflict_club.grp_con_avatar_turn_relationships USING btree (target_turn_id);


--
-- Name: idx_conflict_club_grp_con_avatar_turns_template_topic_id; Type: INDEX; Schema: conflict_club; Owner: -
--

CREATE INDEX idx_conflict_club_grp_con_avatar_turns_template_topic_id ON conflict_club.grp_con_avatar_turns USING btree (template_topic_id);


--
-- Name: idx_conflict_club_grp_cons_template_id; Type: INDEX; Schema: conflict_club; Owner: -
--

CREATE INDEX idx_conflict_club_grp_cons_template_id ON conflict_club.grp_cons USING btree (template_id);


--
-- Name: idx_conflict_club_grp_template_topics_template_id; Type: INDEX; Schema: conflict_club; Owner: -
--

CREATE INDEX idx_conflict_club_grp_template_topics_template_id ON conflict_club.grp_template_topics USING btree (template_id);


--
-- Name: idx_conflict_club_grp_template_topics_topic_index; Type: INDEX; Schema: conflict_club; Owner: -
--

CREATE INDEX idx_conflict_club_grp_template_topics_topic_index ON conflict_club.grp_template_topics USING btree (topic_index);


--
-- Name: idx_conflict_club_grp_templates_group_id; Type: INDEX; Schema: conflict_club; Owner: -
--

CREATE INDEX idx_conflict_club_grp_templates_group_id ON conflict_club.grp_templates USING btree (group_id);


--
-- Name: idx_conflict_club_grp_templates_participant_id; Type: INDEX; Schema: conflict_club; Owner: -
--

CREATE INDEX idx_conflict_club_grp_templates_participant_id ON conflict_club.grp_templates USING btree (created_by_participant_id);


--
-- Name: idx_grp_con_avatar_turns_message_type_id; Type: INDEX; Schema: conflict_club; Owner: -
--

CREATE INDEX idx_grp_con_avatar_turns_message_type_id ON conflict_club.grp_con_avatar_turns USING btree (message_type_id);


--
-- Name: idx_grp_cons_parent_id; Type: INDEX; Schema: conflict_club; Owner: -
--

CREATE INDEX idx_grp_cons_parent_id ON conflict_club.grp_cons USING btree (parent_grp_con_id);


--
-- Name: idx_grp_cons_type_id; Type: INDEX; Schema: conflict_club; Owner: -
--

CREATE INDEX idx_grp_cons_type_id ON conflict_club.grp_cons USING btree (type_id);


--
-- Name: grp_con_avatar_turn_relationships_target_turn_id_idx; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX grp_con_avatar_turn_relationships_target_turn_id_idx ON dev.grp_con_avatar_turn_relationships USING btree (target_turn_id);


--
-- Name: idx_dev_grp_con_avatar_turns_template_topic_id; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX idx_dev_grp_con_avatar_turns_template_topic_id ON dev.grp_con_avatar_turns USING btree (template_topic_id);


--
-- Name: idx_dev_grp_cons_template_id; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX idx_dev_grp_cons_template_id ON dev.grp_cons USING btree (template_id);


--
-- Name: idx_grp_con_avatar_turns_message_type_id; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX idx_grp_con_avatar_turns_message_type_id ON dev.grp_con_avatar_turns USING btree (message_type_id);


--
-- Name: idx_grp_cons_parent_id; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX idx_grp_cons_parent_id ON dev.grp_cons USING btree (parent_grp_con_id);


--
-- Name: idx_grp_template_topics_template_id; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX idx_grp_template_topics_template_id ON dev.grp_template_topics USING btree (template_id);


--
-- Name: idx_grp_template_topics_topic_index; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX idx_grp_template_topics_topic_index ON dev.grp_template_topics USING btree (topic_index);


--
-- Name: idx_grp_templates_group_id; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX idx_grp_templates_group_id ON dev.grp_templates USING btree (group_id);


--
-- Name: idx_grp_templates_participant_id; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX idx_grp_templates_participant_id ON dev.grp_templates USING btree (created_by_participant_id);


--
-- Name: topic_paths_path_idx; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX topic_paths_path_idx ON dev.topic_paths USING gist (path);


--
-- Name: grp_con_avatar_turn_relationships_target_turn_id_idx; Type: INDEX; Schema: first_congregational; Owner: -
--

CREATE INDEX grp_con_avatar_turn_relationships_target_turn_id_idx ON first_congregational.grp_con_avatar_turn_relationships USING btree (target_turn_id);


--
-- Name: idx_first_congregational_grp_con_avatar_turns_template_topic_id; Type: INDEX; Schema: first_congregational; Owner: -
--

CREATE INDEX idx_first_congregational_grp_con_avatar_turns_template_topic_id ON first_congregational.grp_con_avatar_turns USING btree (template_topic_id);


--
-- Name: idx_first_congregational_grp_cons_template_id; Type: INDEX; Schema: first_congregational; Owner: -
--

CREATE INDEX idx_first_congregational_grp_cons_template_id ON first_congregational.grp_cons USING btree (template_id);


--
-- Name: idx_first_congregational_grp_template_topics_template_id; Type: INDEX; Schema: first_congregational; Owner: -
--

CREATE INDEX idx_first_congregational_grp_template_topics_template_id ON first_congregational.grp_template_topics USING btree (template_id);


--
-- Name: idx_first_congregational_grp_template_topics_topic_index; Type: INDEX; Schema: first_congregational; Owner: -
--

CREATE INDEX idx_first_congregational_grp_template_topics_topic_index ON first_congregational.grp_template_topics USING btree (topic_index);


--
-- Name: idx_first_congregational_grp_templates_group_id; Type: INDEX; Schema: first_congregational; Owner: -
--

CREATE INDEX idx_first_congregational_grp_templates_group_id ON first_congregational.grp_templates USING btree (group_id);


--
-- Name: idx_first_congregational_grp_templates_participant_id; Type: INDEX; Schema: first_congregational; Owner: -
--

CREATE INDEX idx_first_congregational_grp_templates_participant_id ON first_congregational.grp_templates USING btree (created_by_participant_id);


--
-- Name: idx_grp_con_avatar_turns_message_type_id; Type: INDEX; Schema: first_congregational; Owner: -
--

CREATE INDEX idx_grp_con_avatar_turns_message_type_id ON first_congregational.grp_con_avatar_turns USING btree (message_type_id);


--
-- Name: idx_grp_cons_parent_id; Type: INDEX; Schema: first_congregational; Owner: -
--

CREATE INDEX idx_grp_cons_parent_id ON first_congregational.grp_cons USING btree (parent_grp_con_id);


--
-- Name: idx_grp_cons_type_id; Type: INDEX; Schema: first_congregational; Owner: -
--

CREATE INDEX idx_grp_cons_type_id ON first_congregational.grp_cons USING btree (type_id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: grp_con_avatar_turn_relationships_target_turn_id_idx; Type: INDEX; Schema: template; Owner: -
--

CREATE INDEX grp_con_avatar_turn_relationships_target_turn_id_idx ON template.grp_con_avatar_turn_relationships USING btree (target_turn_id);


--
-- Name: idx_grp_con_avatar_turns_message_type_id; Type: INDEX; Schema: template; Owner: -
--

CREATE INDEX idx_grp_con_avatar_turns_message_type_id ON template.grp_con_avatar_turns USING btree (message_type_id);


--
-- Name: idx_grp_cons_parent_id; Type: INDEX; Schema: template; Owner: -
--

CREATE INDEX idx_grp_cons_parent_id ON template.grp_cons USING btree (parent_grp_con_id);


--
-- Name: idx_template_grp_con_avatar_turns_template_topic_id; Type: INDEX; Schema: template; Owner: -
--

CREATE INDEX idx_template_grp_con_avatar_turns_template_topic_id ON template.grp_con_avatar_turns USING btree (template_topic_id);


--
-- Name: idx_template_grp_cons_template_id; Type: INDEX; Schema: template; Owner: -
--

CREATE INDEX idx_template_grp_cons_template_id ON template.grp_cons USING btree (template_id);


--
-- Name: idx_template_grp_template_topics_template_id; Type: INDEX; Schema: template; Owner: -
--

CREATE INDEX idx_template_grp_template_topics_template_id ON template.grp_template_topics USING btree (template_id);


--
-- Name: idx_template_grp_template_topics_topic_index; Type: INDEX; Schema: template; Owner: -
--

CREATE INDEX idx_template_grp_template_topics_topic_index ON template.grp_template_topics USING btree (topic_index);


--
-- Name: idx_template_grp_templates_group_id; Type: INDEX; Schema: template; Owner: -
--

CREATE INDEX idx_template_grp_templates_group_id ON template.grp_templates USING btree (group_id);


--
-- Name: idx_template_grp_templates_participant_id; Type: INDEX; Schema: template; Owner: -
--

CREATE INDEX idx_template_grp_templates_participant_id ON template.grp_templates USING btree (created_by_participant_id);


--
-- Name: grp_con_avatar_turn_relationships_target_turn_id_idx; Type: INDEX; Schema: timethatremains; Owner: -
--

CREATE INDEX grp_con_avatar_turn_relationships_target_turn_id_idx ON timethatremains.grp_con_avatar_turn_relationships USING btree (target_turn_id);


--
-- Name: idx_grp_con_avatar_turns_message_type_id; Type: INDEX; Schema: timethatremains; Owner: -
--

CREATE INDEX idx_grp_con_avatar_turns_message_type_id ON timethatremains.grp_con_avatar_turns USING btree (message_type_id);


--
-- Name: idx_grp_cons_parent_id; Type: INDEX; Schema: timethatremains; Owner: -
--

CREATE INDEX idx_grp_cons_parent_id ON timethatremains.grp_cons USING btree (parent_grp_con_id);


--
-- Name: idx_timethatremains_grp_con_avatar_turns_template_topic_id; Type: INDEX; Schema: timethatremains; Owner: -
--

CREATE INDEX idx_timethatremains_grp_con_avatar_turns_template_topic_id ON timethatremains.grp_con_avatar_turns USING btree (template_topic_id);


--
-- Name: idx_timethatremains_grp_cons_template_id; Type: INDEX; Schema: timethatremains; Owner: -
--

CREATE INDEX idx_timethatremains_grp_cons_template_id ON timethatremains.grp_cons USING btree (template_id);


--
-- Name: idx_timethatremains_grp_template_topics_template_id; Type: INDEX; Schema: timethatremains; Owner: -
--

CREATE INDEX idx_timethatremains_grp_template_topics_template_id ON timethatremains.grp_template_topics USING btree (template_id);


--
-- Name: idx_timethatremains_grp_template_topics_topic_index; Type: INDEX; Schema: timethatremains; Owner: -
--

CREATE INDEX idx_timethatremains_grp_template_topics_topic_index ON timethatremains.grp_template_topics USING btree (topic_index);


--
-- Name: idx_timethatremains_grp_templates_group_id; Type: INDEX; Schema: timethatremains; Owner: -
--

CREATE INDEX idx_timethatremains_grp_templates_group_id ON timethatremains.grp_templates USING btree (group_id);


--
-- Name: idx_timethatremains_grp_templates_participant_id; Type: INDEX; Schema: timethatremains; Owner: -
--

CREATE INDEX idx_timethatremains_grp_templates_participant_id ON timethatremains.grp_templates USING btree (created_by_participant_id);


--
-- Name: participant_roles update_participant_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_participant_roles_updated_at BEFORE UPDATE ON public.participant_roles FOR EACH ROW EXECUTE FUNCTION public.update_participant_roles_updated_at();


--
-- Name: grp_con_avatar_turns bsa_grp_con_avatar_turns_template_topic_id_fkey; Type: FK CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_con_avatar_turns
    ADD CONSTRAINT bsa_grp_con_avatar_turns_template_topic_id_fkey FOREIGN KEY (template_topic_id) REFERENCES bsa.grp_template_topics(id) ON DELETE SET NULL;


--
-- Name: grp_templates fk_group; Type: FK CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_templates
    ADD CONSTRAINT fk_group FOREIGN KEY (group_id) REFERENCES bsa.groups(id) ON DELETE CASCADE;


--
-- Name: grp_cons fk_grp_con_type; Type: FK CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_cons
    ADD CONSTRAINT fk_grp_con_type FOREIGN KEY (type_id) REFERENCES public.grp_con_types(id);


--
-- Name: grp_con_avatar_turns fk_message_type; Type: FK CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_con_avatar_turns
    ADD CONSTRAINT fk_message_type FOREIGN KEY (message_type_id) REFERENCES public.message_types(id);


--
-- Name: grp_cons fk_parent_grp_con; Type: FK CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_cons
    ADD CONSTRAINT fk_parent_grp_con FOREIGN KEY (parent_grp_con_id) REFERENCES bsa.grp_cons(id) ON DELETE SET NULL;


--
-- Name: grp_templates fk_participant; Type: FK CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_templates
    ADD CONSTRAINT fk_participant FOREIGN KEY (created_by_participant_id) REFERENCES public.participants(id) ON DELETE SET NULL;


--
-- Name: grp_template_topics fk_template; Type: FK CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_template_topics
    ADD CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES bsa.grp_templates(id) ON DELETE CASCADE;


--
-- Name: grp_cons fk_template; Type: FK CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.grp_cons
    ADD CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES bsa.grp_templates(id) ON DELETE SET NULL;


--
-- Name: groups groups_group_type_id_fkey; Type: FK CONSTRAINT; Schema: bsa; Owner: -
--

ALTER TABLE ONLY bsa.groups
    ADD CONSTRAINT groups_group_type_id_fkey FOREIGN KEY (group_type_id) REFERENCES public.group_types(id);


--
-- Name: grp_con_avatar_turns conflict_club_grp_con_avatar_turns_template_topic_id_fkey; Type: FK CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_con_avatar_turns
    ADD CONSTRAINT conflict_club_grp_con_avatar_turns_template_topic_id_fkey FOREIGN KEY (template_topic_id) REFERENCES conflict_club.grp_template_topics(id) ON DELETE SET NULL;


--
-- Name: grp_templates fk_group; Type: FK CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_templates
    ADD CONSTRAINT fk_group FOREIGN KEY (group_id) REFERENCES conflict_club.groups(id) ON DELETE CASCADE;


--
-- Name: grp_cons fk_grp_con_type; Type: FK CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_cons
    ADD CONSTRAINT fk_grp_con_type FOREIGN KEY (type_id) REFERENCES public.grp_con_types(id);


--
-- Name: grp_con_avatar_turns fk_message_type; Type: FK CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_con_avatar_turns
    ADD CONSTRAINT fk_message_type FOREIGN KEY (message_type_id) REFERENCES public.message_types(id);


--
-- Name: grp_cons fk_parent_grp_con; Type: FK CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_cons
    ADD CONSTRAINT fk_parent_grp_con FOREIGN KEY (parent_grp_con_id) REFERENCES bsa.grp_cons(id) ON DELETE SET NULL;


--
-- Name: grp_templates fk_participant; Type: FK CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_templates
    ADD CONSTRAINT fk_participant FOREIGN KEY (created_by_participant_id) REFERENCES public.participants(id) ON DELETE SET NULL;


--
-- Name: grp_template_topics fk_template; Type: FK CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_template_topics
    ADD CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES conflict_club.grp_templates(id) ON DELETE CASCADE;


--
-- Name: grp_cons fk_template; Type: FK CONSTRAINT; Schema: conflict_club; Owner: -
--

ALTER TABLE ONLY conflict_club.grp_cons
    ADD CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES conflict_club.grp_templates(id) ON DELETE SET NULL;


--
-- Name: client_schema_preferences client_schema_preferences_client_schema_id_fkey; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.client_schema_preferences
    ADD CONSTRAINT client_schema_preferences_client_schema_id_fkey FOREIGN KEY (client_schema_id) REFERENCES dev.client_schemas(id) ON DELETE CASCADE;


--
-- Name: client_schema_preferences client_schema_preferences_preference_type_id_fkey; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.client_schema_preferences
    ADD CONSTRAINT client_schema_preferences_preference_type_id_fkey FOREIGN KEY (preference_type_id) REFERENCES public.preference_types(id) ON DELETE CASCADE;


--
-- Name: client_schemas client_schemas_client_id_fkey; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.client_schemas
    ADD CONSTRAINT client_schemas_client_id_fkey FOREIGN KEY (client_id) REFERENCES dev.clients(id) ON DELETE CASCADE;


--
-- Name: grp_templates fk_group; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_templates
    ADD CONSTRAINT fk_group FOREIGN KEY (group_id) REFERENCES dev.groups(id) ON DELETE CASCADE;


--
-- Name: grp_con_avatar_turns fk_message_type; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_con_avatar_turns
    ADD CONSTRAINT fk_message_type FOREIGN KEY (message_type_id) REFERENCES public.message_types(id);


--
-- Name: grp_cons fk_parent_grp_con; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_cons
    ADD CONSTRAINT fk_parent_grp_con FOREIGN KEY (parent_grp_con_id) REFERENCES dev.grp_cons(id) ON DELETE SET NULL;


--
-- Name: grp_templates fk_participant; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_templates
    ADD CONSTRAINT fk_participant FOREIGN KEY (created_by_participant_id) REFERENCES public.participants(id) ON DELETE SET NULL;


--
-- Name: participant_groups fk_participant_role; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.participant_groups
    ADD CONSTRAINT fk_participant_role FOREIGN KEY (participant_role_id) REFERENCES public.participant_roles(role_id);


--
-- Name: grp_template_topics fk_template; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_template_topics
    ADD CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES dev.grp_templates(id) ON DELETE CASCADE;


--
-- Name: grp_cons fk_template; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_cons
    ADD CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES dev.grp_templates(id) ON DELETE SET NULL;


--
-- Name: groups groups_group_type_id_fkey; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.groups
    ADD CONSTRAINT groups_group_type_id_fkey FOREIGN KEY (group_type_id) REFERENCES public.group_types(id);


--
-- Name: grp_con_avatar_turns grp_con_avatar_turns_template_topic_id_fkey; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.grp_con_avatar_turns
    ADD CONSTRAINT grp_con_avatar_turns_template_topic_id_fkey FOREIGN KEY (template_topic_id) REFERENCES dev.grp_template_topics(id) ON DELETE SET NULL;


--
-- Name: topic_paths topic_paths_created_by_fkey; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY dev.topic_paths
    ADD CONSTRAINT topic_paths_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.participants(id);


--
-- Name: grp_con_avatar_turns first_congregational_grp_con_avatar_turns_template_topic_id_fke; Type: FK CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_con_avatar_turns
    ADD CONSTRAINT first_congregational_grp_con_avatar_turns_template_topic_id_fke FOREIGN KEY (template_topic_id) REFERENCES first_congregational.grp_template_topics(id) ON DELETE SET NULL;


--
-- Name: grp_templates fk_group; Type: FK CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_templates
    ADD CONSTRAINT fk_group FOREIGN KEY (group_id) REFERENCES first_congregational.groups(id) ON DELETE CASCADE;


--
-- Name: grp_cons fk_grp_con_type; Type: FK CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_cons
    ADD CONSTRAINT fk_grp_con_type FOREIGN KEY (type_id) REFERENCES public.grp_con_types(id);


--
-- Name: grp_con_avatar_turns fk_message_type; Type: FK CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_con_avatar_turns
    ADD CONSTRAINT fk_message_type FOREIGN KEY (message_type_id) REFERENCES public.message_types(id);


--
-- Name: grp_cons fk_parent_grp_con; Type: FK CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_cons
    ADD CONSTRAINT fk_parent_grp_con FOREIGN KEY (parent_grp_con_id) REFERENCES first_congregational.grp_cons(id) ON DELETE SET NULL;


--
-- Name: grp_templates fk_participant; Type: FK CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_templates
    ADD CONSTRAINT fk_participant FOREIGN KEY (created_by_participant_id) REFERENCES public.participants(id) ON DELETE SET NULL;


--
-- Name: grp_template_topics fk_template; Type: FK CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_template_topics
    ADD CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES first_congregational.grp_templates(id) ON DELETE CASCADE;


--
-- Name: grp_cons fk_template; Type: FK CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.grp_cons
    ADD CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES first_congregational.grp_templates(id) ON DELETE SET NULL;


--
-- Name: groups groups_group_type_id_fkey; Type: FK CONSTRAINT; Schema: first_congregational; Owner: -
--

ALTER TABLE ONLY first_congregational.groups
    ADD CONSTRAINT groups_group_type_id_fkey FOREIGN KEY (group_type_id) REFERENCES public.group_types(id);


--
-- Name: llms llms_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llms
    ADD CONSTRAINT llms_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.llm_types(id);


--
-- Name: grp_templates fk_group; Type: FK CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_templates
    ADD CONSTRAINT fk_group FOREIGN KEY (group_id) REFERENCES template.groups(id) ON DELETE CASCADE;


--
-- Name: grp_con_avatar_turns fk_message_type; Type: FK CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_con_avatar_turns
    ADD CONSTRAINT fk_message_type FOREIGN KEY (message_type_id) REFERENCES public.message_types(id);


--
-- Name: grp_cons fk_parent_grp_con; Type: FK CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_cons
    ADD CONSTRAINT fk_parent_grp_con FOREIGN KEY (parent_grp_con_id) REFERENCES template.grp_cons(id) ON DELETE SET NULL;


--
-- Name: grp_templates fk_participant; Type: FK CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_templates
    ADD CONSTRAINT fk_participant FOREIGN KEY (created_by_participant_id) REFERENCES public.participants(id) ON DELETE SET NULL;


--
-- Name: grp_template_topics fk_template; Type: FK CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_template_topics
    ADD CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES template.grp_templates(id) ON DELETE CASCADE;


--
-- Name: grp_cons fk_template; Type: FK CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_cons
    ADD CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES template.grp_templates(id) ON DELETE SET NULL;


--
-- Name: groups groups_group_type_id_fkey; Type: FK CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.groups
    ADD CONSTRAINT groups_group_type_id_fkey FOREIGN KEY (group_type_id) REFERENCES public.group_types(id);


--
-- Name: grp_con_avatar_turns template_grp_con_avatar_turns_template_topic_id_fkey; Type: FK CONSTRAINT; Schema: template; Owner: -
--

ALTER TABLE ONLY template.grp_con_avatar_turns
    ADD CONSTRAINT template_grp_con_avatar_turns_template_topic_id_fkey FOREIGN KEY (template_topic_id) REFERENCES template.grp_template_topics(id) ON DELETE SET NULL;


--
-- Name: grp_templates fk_group; Type: FK CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_templates
    ADD CONSTRAINT fk_group FOREIGN KEY (group_id) REFERENCES timethatremains.groups(id) ON DELETE CASCADE;


--
-- Name: grp_con_avatar_turns fk_message_type; Type: FK CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_con_avatar_turns
    ADD CONSTRAINT fk_message_type FOREIGN KEY (message_type_id) REFERENCES public.message_types(id);


--
-- Name: grp_cons fk_parent_grp_con; Type: FK CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_cons
    ADD CONSTRAINT fk_parent_grp_con FOREIGN KEY (parent_grp_con_id) REFERENCES timethatremains.grp_cons(id) ON DELETE SET NULL;


--
-- Name: grp_templates fk_participant; Type: FK CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_templates
    ADD CONSTRAINT fk_participant FOREIGN KEY (created_by_participant_id) REFERENCES public.participants(id) ON DELETE SET NULL;


--
-- Name: grp_template_topics fk_template; Type: FK CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_template_topics
    ADD CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES timethatremains.grp_templates(id) ON DELETE CASCADE;


--
-- Name: grp_cons fk_template; Type: FK CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_cons
    ADD CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES timethatremains.grp_templates(id) ON DELETE SET NULL;


--
-- Name: groups groups_group_type_id_fkey; Type: FK CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.groups
    ADD CONSTRAINT groups_group_type_id_fkey FOREIGN KEY (group_type_id) REFERENCES public.group_types(id);


--
-- Name: grp_con_avatar_turns timethatremains_grp_con_avatar_turns_template_topic_id_fkey; Type: FK CONSTRAINT; Schema: timethatremains; Owner: -
--

ALTER TABLE ONLY timethatremains.grp_con_avatar_turns
    ADD CONSTRAINT timethatremains_grp_con_avatar_turns_template_topic_id_fkey FOREIGN KEY (template_topic_id) REFERENCES timethatremains.grp_template_topics(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

