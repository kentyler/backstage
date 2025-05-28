-- Migration script to copy dev schema to another schema
-- Usage: psql -v new_schema=your_schema_name -f this_file.sql

-- Set the target schema name (use -v new_schema=schema_name when running with psql)
\set target_schema :new_schema

-- Create the new schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS :"target_schema";

-- The following is the structure from the dev schema, modified to use the target schema

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
-- Name: dev; Type: SCHEMA; Schema: -; Owner: -
--

-- Original: CREATE SCHEMA dev;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: avatar_scopes; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".avatar_scopes (
    id integer NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: avatar_scopes_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".avatar_scopes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatar_scopes_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE :"target_schema".avatar_scopes_id_seq OWNED BY :"target_schema".avatar_scopes.id;


--
-- Name: avatars; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".avatars (
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

CREATE SEQUENCE :"target_schema".avatars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatars_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE :"target_schema".avatars_id_seq OWNED BY :"target_schema".avatars.id;


--
-- Name: client_schema_preferences; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".client_schema_preferences (
    id integer NOT NULL,
    client_schema_id integer NOT NULL,
    preference_type_id integer NOT NULL,
    preference_value text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_schema_preferences_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".client_schema_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: client_schema_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE :"target_schema".client_schema_preferences_id_seq OWNED BY :"target_schema".client_schema_preferences.id;


--
-- Name: client_schemas; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".client_schemas (
    id integer NOT NULL,
    client_id integer NOT NULL,
    schema_name character varying(63) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_schemas_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".client_schemas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: client_schemas_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE :"target_schema".client_schemas_id_seq OWNED BY :"target_schema".client_schemas.id;


--
-- Name: clients; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".clients (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE :"target_schema".clients_id_seq OWNED BY :"target_schema".clients.id;


--
-- Name: file_upload_vectors; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".file_upload_vectors (
    id integer NOT NULL,
    file_upload_id integer NOT NULL,
    chunk_index integer NOT NULL,
    content_text text NOT NULL,
    content_vector public.vector(1536),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: file_upload_vectors_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".file_upload_vectors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: file_upload_vectors_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE :"target_schema".file_upload_vectors_id_seq OWNED BY :"target_schema".file_upload_vectors.id;


--
-- Name: file_uploads; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".file_uploads (
    id integer NOT NULL,
    filename text NOT NULL,
    mime_type text NOT NULL,
    file_path text NOT NULL,
    file_size bigint,
    public_url text,
    bucket_name text,
    description text,
    tags text[],
    uploaded_at timestamp with time zone DEFAULT now()
);


--
-- Name: file_uploads_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".file_uploads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: file_uploads_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE :"target_schema".file_uploads_id_seq OWNED BY :"target_schema".file_uploads.id;


--
-- Name: group_conversation_avatar_turn_relationships_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".group_conversation_avatar_turn_relationships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatar_turns_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".group_conversation_avatar_turns_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatars_avatar_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".group_conversation_avatars_avatar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_avatars_group_conversation_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".group_conversation_avatars_group_conversation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_upload_vectors_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".group_conversation_upload_vectors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversation_uploads_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".group_conversation_uploads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_conversations_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".group_conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_preferences; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".group_preferences (
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

CREATE SEQUENCE :"target_schema".group_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE :"target_schema".group_preferences_id_seq OWNED BY :"target_schema".group_preferences.id;


--
-- Name: groups; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".groups (
    id bigint NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    group_type_id integer
);


--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE :"target_schema".groups_id_seq OWNED BY :"target_schema".groups.id;


--
-- Name: grp_con_avatars_avatar_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".grp_con_avatars_avatar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_con_avatars_grp_con_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".grp_con_avatars_grp_con_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_template_topics; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".grp_template_topics (
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

COMMENT ON TABLE :"target_schema".grp_template_topics IS 'Defines topics for templates';


--
-- Name: grp_template_topics_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".grp_template_topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_template_topics_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE :"target_schema".grp_template_topics_id_seq OWNED BY :"target_schema".grp_template_topics.id;


--
-- Name: grp_templates; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".grp_templates (
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

COMMENT ON TABLE :"target_schema".grp_templates IS 'Defines templates that belong to groups';


--
-- Name: grp_templates_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".grp_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE :"target_schema".grp_templates_id_seq OWNED BY :"target_schema".grp_templates.id;


--
-- Name: grp_topic_avatar_turns; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".grp_topic_avatar_turns (
    id integer NOT NULL,
    avatar_id integer NOT NULL,
    turn_index numeric NOT NULL,
    content_text text NOT NULL,
    content_vector public.vector(1536),
    turn_kind_id integer DEFAULT 1 NOT NULL,
    message_type_id integer,
    template_topic_id integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    topic_id bigint,
    llm_id integer,
    participant_id integer
);


--
-- Name: grp_topic_avatar_turns_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".grp_topic_avatar_turns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_topic_avatar_turns_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE :"target_schema".grp_topic_avatar_turns_id_seq OWNED BY :"target_schema".grp_topic_avatar_turns.id;


--
-- Name: grp_topic_avatar_turns_with_names; Type: VIEW; Schema: dev; Owner: -
--

CREATE VIEW :"target_schema".grp_topic_avatar_turns_with_names AS
 SELECT t.id,
    t.topic_id,
    t.avatar_id,
    t.content_text,
    t.message_type_id,
    t.turn_kind_id,
    t.created_at,
    t.turn_index,
    t.llm_id,
    t.participant_id,
    p.name AS participant_name,
    l.name AS llm_name
   FROM ((:"target_schema".grp_topic_avatar_turns t
     LEFT JOIN public.participants p ON ((t.participant_id = p.id)))
     LEFT JOIN public.llms l ON ((t.llm_id = l.id)));


--
-- Name: grp_topic_avatars; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".grp_topic_avatars (
    id integer NOT NULL,
    topic_path_id text NOT NULL,
    avatar_id bigint NOT NULL,
    added_at timestamp with time zone DEFAULT now()
);


--
-- Name: grp_topic_avatars_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".grp_topic_avatars_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grp_topic_avatars_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE :"target_schema".grp_topic_avatars_id_seq OWNED BY :"target_schema".grp_topic_avatars.id;


--
-- Name: llm_config_view; Type: VIEW; Schema: dev; Owner: -
--

CREATE VIEW :"target_schema".llm_config_view AS
 SELECT l.id AS llm_id,
    l.name AS llm_name,
    l.provider,
    l.model,
    l.temperature,
    l.max_tokens,
    l.additional_config,
    l.created_at,
    l.updated_at,
    lt.id AS llm_type_id,
    lt.name AS llm_type_name,
    lt.description AS llm_type_description,
    lt.api_handler,
    pt.id AS preference_type_id,
    pt.name AS preference_type_name,
    pt.description AS preference_type_description,
    csp.client_schema_id,
    csp.preference_value,
    csp.created_at AS preference_created_at
   FROM (((public.llms l
     JOIN public.llm_types lt ON ((l.type_id = lt.id)))
     LEFT JOIN :"target_schema".client_schema_preferences csp ON (((l.id = (((csp.preference_value)::jsonb ->> 'llmId'::text))::integer) AND (csp.preference_type_id = ( SELECT preference_types.id
           FROM public.preference_types
          WHERE ((preference_types.name)::text = 'llm_preference'::text))))))
     LEFT JOIN public.preference_types pt ON ((pt.id = csp.preference_type_id)))
  ORDER BY l.name;


--
-- Name: participant_avatars; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".participant_avatars (
    id bigint NOT NULL,
    participant_id bigint NOT NULL,
    avatar_id bigint NOT NULL,
    created_at date DEFAULT CURRENT_DATE,
    created_by_participant_id bigint
);


--
-- Name: participant_avatars_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".participant_avatars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_avatars_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE :"target_schema".participant_avatars_id_seq OWNED BY :"target_schema".participant_avatars.id;


--
-- Name: participant_events; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".participant_events (
    id integer NOT NULL,
    participant_id bigint NOT NULL,
    event_type_id integer NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN participant_events.participant_id; Type: COMMENT; Schema: dev; Owner: -
--

COMMENT ON COLUMN :"target_schema".participant_events.participant_id IS 'The ID of the participant (can be null for events not associated with a specific participant, e.g., login attempts with non-existent emails)';


--
-- Name: participant_events_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".participant_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_events_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE :"target_schema".participant_events_id_seq OWNED BY :"target_schema".participant_events.id;


--
-- Name: participant_groups; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".participant_groups (
    participant_id bigint NOT NULL,
    group_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    participant_role_id integer NOT NULL
);


--
-- Name: COLUMN participant_groups.participant_role_id; Type: COMMENT; Schema: dev; Owner: -
--

COMMENT ON COLUMN :"target_schema".participant_groups.participant_role_id IS 'Foreign key to public.participant_roles defining the participant''s role in the group';


--
-- Name: participant_groups_group_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".participant_groups_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_groups_participant_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".participant_groups_participant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_llms; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".participant_llms (
    id bigint NOT NULL,
    participant_id bigint NOT NULL,
    llm_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: participant_llms_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".participant_llms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_llms_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE :"target_schema".participant_llms_id_seq OWNED BY :"target_schema".participant_llms.id;


--
-- Name: participant_preferences; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".participant_preferences (
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

CREATE SEQUENCE :"target_schema".participant_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE :"target_schema".participant_preferences_id_seq OWNED BY :"target_schema".participant_preferences.id;


--
-- Name: relationship_types_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".relationship_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_preferences; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".site_preferences (
    id integer NOT NULL,
    preference_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    value bigint
);


--
-- Name: site_preferences_id_seq; Type: SEQUENCE; Schema: dev; Owner: -
--

CREATE SEQUENCE :"target_schema".site_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: dev; Owner: -
--

ALTER SEQUENCE :"target_schema".site_preferences_id_seq OWNED BY :"target_schema".site_preferences.id;


--
-- Name: topic_paths; Type: TABLE; Schema: dev; Owner: -
--

CREATE TABLE :"target_schema".topic_paths (
    path public.ltree NOT NULL,
    created_by integer,
    created_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    index text NOT NULL,
    id bigint DEFAULT nextval('public.topic_paths_numeric_id_seq'::regclass) NOT NULL,
    CONSTRAINT valid_path CHECK ((path IS NOT NULL))
);


--
-- Name: avatar_scopes id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".avatar_scopes ALTER COLUMN id SET DEFAULT nextval(':"target_schema".avatar_scopes_id_seq'::regclass);


--
-- Name: avatars id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".avatars ALTER COLUMN id SET DEFAULT nextval(':"target_schema".avatars_id_seq'::regclass);


--
-- Name: client_schema_preferences id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".client_schema_preferences ALTER COLUMN id SET DEFAULT nextval(':"target_schema".client_schema_preferences_id_seq'::regclass);


--
-- Name: client_schemas id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".client_schemas ALTER COLUMN id SET DEFAULT nextval(':"target_schema".client_schemas_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".clients ALTER COLUMN id SET DEFAULT nextval(':"target_schema".clients_id_seq'::regclass);


--
-- Name: file_upload_vectors id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".file_upload_vectors ALTER COLUMN id SET DEFAULT nextval(':"target_schema".file_upload_vectors_id_seq'::regclass);


--
-- Name: file_uploads id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".file_uploads ALTER COLUMN id SET DEFAULT nextval(':"target_schema".file_uploads_id_seq'::regclass);


--
-- Name: group_preferences id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".group_preferences ALTER COLUMN id SET DEFAULT nextval(':"target_schema".group_preferences_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".groups ALTER COLUMN id SET DEFAULT nextval(':"target_schema".groups_id_seq'::regclass);


--
-- Name: grp_template_topics id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".grp_template_topics ALTER COLUMN id SET DEFAULT nextval(':"target_schema".grp_template_topics_id_seq'::regclass);


--
-- Name: grp_templates id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".grp_templates ALTER COLUMN id SET DEFAULT nextval(':"target_schema".grp_templates_id_seq'::regclass);


--
-- Name: grp_topic_avatar_turns id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".grp_topic_avatar_turns ALTER COLUMN id SET DEFAULT nextval(':"target_schema".grp_topic_avatar_turns_id_seq'::regclass);


--
-- Name: grp_topic_avatars id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".grp_topic_avatars ALTER COLUMN id SET DEFAULT nextval(':"target_schema".grp_topic_avatars_id_seq'::regclass);


--
-- Name: participant_avatars id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".participant_avatars ALTER COLUMN id SET DEFAULT nextval(':"target_schema".participant_avatars_id_seq'::regclass);


--
-- Name: participant_events id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".participant_events ALTER COLUMN id SET DEFAULT nextval(':"target_schema".participant_events_id_seq'::regclass);


--
-- Name: participant_llms id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".participant_llms ALTER COLUMN id SET DEFAULT nextval(':"target_schema".participant_llms_id_seq'::regclass);


--
-- Name: participant_preferences id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".participant_preferences ALTER COLUMN id SET DEFAULT nextval(':"target_schema".participant_preferences_id_seq'::regclass);


--
-- Name: site_preferences id; Type: DEFAULT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".site_preferences ALTER COLUMN id SET DEFAULT nextval(':"target_schema".site_preferences_id_seq'::regclass);


--
-- Name: avatar_scopes avatar_scopes_name_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".avatar_scopes
    ADD CONSTRAINT avatar_scopes_name_key UNIQUE (name);


--
-- Name: avatar_scopes avatar_scopes_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".avatar_scopes
    ADD CONSTRAINT avatar_scopes_pkey PRIMARY KEY (id);


--
-- Name: avatars avatars_name_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".avatars
    ADD CONSTRAINT avatars_name_key UNIQUE (name);


--
-- Name: avatars avatars_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".avatars
    ADD CONSTRAINT avatars_pkey PRIMARY KEY (id);


--
-- Name: client_schema_preferences client_schema_preferences_client_schema_id_preference_type__key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".client_schema_preferences
    ADD CONSTRAINT client_schema_preferences_client_schema_id_preference_type__key UNIQUE (client_schema_id, preference_type_id);


--
-- Name: client_schema_preferences client_schema_preferences_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".client_schema_preferences
    ADD CONSTRAINT client_schema_preferences_pkey PRIMARY KEY (id);


--
-- Name: client_schemas client_schemas_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".client_schemas
    ADD CONSTRAINT client_schemas_pkey PRIMARY KEY (id);


--
-- Name: client_schemas client_schemas_schema_name_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".client_schemas
    ADD CONSTRAINT client_schemas_schema_name_key UNIQUE (schema_name);


--
-- Name: clients clients_name_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".clients
    ADD CONSTRAINT clients_name_key UNIQUE (name);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: file_upload_vectors file_upload_vectors_file_upload_id_chunk_index_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".file_upload_vectors
    ADD CONSTRAINT file_upload_vectors_file_upload_id_chunk_index_key UNIQUE (file_upload_id, chunk_index);


--
-- Name: file_upload_vectors file_upload_vectors_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".file_upload_vectors
    ADD CONSTRAINT file_upload_vectors_pkey PRIMARY KEY (id);


--
-- Name: file_uploads file_uploads_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".file_uploads
    ADD CONSTRAINT file_uploads_pkey PRIMARY KEY (id);


--
-- Name: group_preferences group_preferences_group_id_preference_type_id_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".group_preferences
    ADD CONSTRAINT group_preferences_group_id_preference_type_id_key UNIQUE (group_id, preference_type_id);


--
-- Name: group_preferences group_preferences_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".group_preferences
    ADD CONSTRAINT group_preferences_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: grp_template_topics grp_template_topics_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".grp_template_topics
    ADD CONSTRAINT grp_template_topics_pkey PRIMARY KEY (id);


--
-- Name: grp_templates grp_templates_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".grp_templates
    ADD CONSTRAINT grp_templates_pkey PRIMARY KEY (id);


--
-- Name: grp_topic_avatar_turns grp_topic_avatar_turns_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".grp_topic_avatar_turns
    ADD CONSTRAINT grp_topic_avatar_turns_pkey PRIMARY KEY (id);


--
-- Name: grp_topic_avatars grp_topic_avatars_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".grp_topic_avatars
    ADD CONSTRAINT grp_topic_avatars_pkey PRIMARY KEY (id);


--
-- Name: participant_avatars participant_avatars_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".participant_avatars
    ADD CONSTRAINT participant_avatars_pkey PRIMARY KEY (id);


--
-- Name: participant_events participant_events_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".participant_events
    ADD CONSTRAINT participant_events_pkey PRIMARY KEY (id);


--
-- Name: participant_groups participant_groups_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".participant_groups
    ADD CONSTRAINT participant_groups_pkey PRIMARY KEY (participant_id, group_id);


--
-- Name: participant_llms participant_llms_participant_id_llm_id_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".participant_llms
    ADD CONSTRAINT participant_llms_participant_id_llm_id_key UNIQUE (participant_id, llm_id);


--
-- Name: participant_llms participant_llms_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".participant_llms
    ADD CONSTRAINT participant_llms_pkey PRIMARY KEY (id);


--
-- Name: participant_preferences participant_preferences_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".participant_preferences
    ADD CONSTRAINT participant_preferences_pkey PRIMARY KEY (id);


--
-- Name: site_preferences site_preferences_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".site_preferences
    ADD CONSTRAINT site_preferences_pkey PRIMARY KEY (id);


--
-- Name: site_preferences site_preferences_preference_type_id_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".site_preferences
    ADD CONSTRAINT site_preferences_preference_type_id_key UNIQUE (preference_type_id);


--
-- Name: topic_paths topic_paths_index_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".topic_paths
    ADD CONSTRAINT topic_paths_index_key UNIQUE (index);


--
-- Name: topic_paths topic_paths_path_key; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".topic_paths
    ADD CONSTRAINT topic_paths_path_key UNIQUE (path);


--
-- Name: topic_paths topic_paths_pkey; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".topic_paths
    ADD CONSTRAINT topic_paths_pkey PRIMARY KEY (id);


--
-- Name: grp_topic_avatars uq_topic_path_avatar; Type: CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".grp_topic_avatars
    ADD CONSTRAINT uq_topic_path_avatar UNIQUE (topic_path_id, avatar_id);


--
-- Name: idx_file_upload_vectors_content_vector; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX idx_file_upload_vectors_content_vector ON :"target_schema".file_upload_vectors USING ivfflat (content_vector public.vector_cosine_ops) WITH (lists='100');


--
-- Name: idx_grp_template_topics_template_id; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX idx_grp_template_topics_template_id ON :"target_schema".grp_template_topics USING btree (template_id);


--
-- Name: idx_grp_template_topics_topic_index; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX idx_grp_template_topics_topic_index ON :"target_schema".grp_template_topics USING btree (topic_index);


--
-- Name: idx_grp_templates_group_id; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX idx_grp_templates_group_id ON :"target_schema".grp_templates USING btree (group_id);


--
-- Name: idx_grp_templates_participant_id; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX idx_grp_templates_participant_id ON :"target_schema".grp_templates USING btree (created_by_participant_id);


--
-- Name: idx_grp_topic_avatar_turns_avatar_id; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX idx_grp_topic_avatar_turns_avatar_id ON :"target_schema".grp_topic_avatar_turns USING btree (avatar_id);


--
-- Name: idx_grp_topic_avatar_turns_content_vector; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX idx_grp_topic_avatar_turns_content_vector ON :"target_schema".grp_topic_avatar_turns USING ivfflat (content_vector public.vector_cosine_ops) WITH (lists='100');


--
-- Name: idx_topic_paths_path; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX idx_topic_paths_path ON :"target_schema".topic_paths USING btree (path);


--
-- Name: topic_paths_path_idx; Type: INDEX; Schema: dev; Owner: -
--

CREATE INDEX topic_paths_path_idx ON :"target_schema".topic_paths USING gist (path);


--
-- Name: client_schema_preferences client_schema_preferences_client_schema_id_fkey; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".client_schema_preferences
    ADD CONSTRAINT client_schema_preferences_client_schema_id_fkey FOREIGN KEY (client_schema_id) REFERENCES :"target_schema".client_schemas(id) ON DELETE CASCADE;


--
-- Name: client_schema_preferences client_schema_preferences_preference_type_id_fkey; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".client_schema_preferences
    ADD CONSTRAINT client_schema_preferences_preference_type_id_fkey FOREIGN KEY (preference_type_id) REFERENCES public.preference_types(id) ON DELETE CASCADE;


--
-- Name: client_schemas client_schemas_client_id_fkey; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".client_schemas
    ADD CONSTRAINT client_schemas_client_id_fkey FOREIGN KEY (client_id) REFERENCES :"target_schema".clients(id) ON DELETE CASCADE;


--
-- Name: file_upload_vectors file_upload_vectors_file_upload_id_fkey; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".file_upload_vectors
    ADD CONSTRAINT file_upload_vectors_file_upload_id_fkey FOREIGN KEY (file_upload_id) REFERENCES :"target_schema".file_uploads(id) ON DELETE CASCADE;


--
-- Name: grp_templates fk_group; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".grp_templates
    ADD CONSTRAINT fk_group FOREIGN KEY (group_id) REFERENCES :"target_schema".groups(id) ON DELETE CASCADE;


--
-- Name: grp_topic_avatars fk_grp_topic_avatars_avatar; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".grp_topic_avatars
    ADD CONSTRAINT fk_grp_topic_avatars_avatar FOREIGN KEY (avatar_id) REFERENCES :"target_schema".avatars(id) ON DELETE CASCADE;


--
-- Name: grp_templates fk_participant; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".grp_templates
    ADD CONSTRAINT fk_participant FOREIGN KEY (created_by_participant_id) REFERENCES public.participants(id) ON DELETE SET NULL;


--
-- Name: participant_groups fk_participant_role; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".participant_groups
    ADD CONSTRAINT fk_participant_role FOREIGN KEY (participant_role_id) REFERENCES public.participant_roles(role_id);


--
-- Name: grp_template_topics fk_template; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".grp_template_topics
    ADD CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES :"target_schema".grp_templates(id) ON DELETE CASCADE;


--
-- Name: groups groups_group_type_id_fkey; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".groups
    ADD CONSTRAINT groups_group_type_id_fkey FOREIGN KEY (group_type_id) REFERENCES public.group_types(id);


--
-- Name: topic_paths topic_paths_created_by_fkey; Type: FK CONSTRAINT; Schema: dev; Owner: -
--

ALTER TABLE ONLY :"target_schema".topic_paths
    ADD CONSTRAINT topic_paths_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.participants(id);


--
-- PostgreSQL database dump complete
--


