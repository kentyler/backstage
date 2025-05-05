-- SQL script to migrate the llms table from client schemas to the public schema
-- This script:
-- 1. Creates the llms table in the public schema if it doesn't exist
-- 2. Adds a 'subdomain' column to the public.llms table
-- 3. Copies data from client schemas to public.llms, setting the subdomain field
-- 4. Updates any foreign key references if necessary

-- First, ensure the llm_types table is in the public schema
DO $$
BEGIN
    -- Check if llm_types exists in public schema
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'llm_types'
    ) THEN
        -- If not, check if it exists in dev schema and copy it
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'dev' 
            AND table_name = 'llm_types'
        ) THEN
            -- Create the table in public schema
            CREATE TABLE public.llm_types AS
            SELECT * FROM dev.llm_types;
            
            -- Set the sequence if it exists
            IF EXISTS (
                SELECT FROM information_schema.sequences
                WHERE sequence_schema = 'dev'
                AND sequence_name = 'llm_types_id_seq'
            ) THEN
                -- Create the sequence in public schema
                CREATE SEQUENCE IF NOT EXISTS public.llm_types_id_seq;
                
                -- Get the current value from dev schema
                SELECT setval('public.llm_types_id_seq', nextval('dev.llm_types_id_seq'), false);
                
                -- Set the sequence as the default for id column
                ALTER TABLE public.llm_types ALTER COLUMN id SET DEFAULT nextval('public.llm_types_id_seq');
            END IF;
            
            RAISE NOTICE 'Created llm_types table in public schema from dev schema';
        ELSE
            RAISE EXCEPTION 'llm_types table not found in public or dev schema';
        END IF;
    END IF;
END $$;

-- Create the llms table in the public schema if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'llms'
    ) THEN
        -- Check if it exists in dev schema
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'dev' 
            AND table_name = 'llms'
        ) THEN
            -- Create the table structure in public schema based on dev schema
            CREATE TABLE public.llms (
                LIKE dev.llms INCLUDING ALL
            );
            
            -- Add the subdomain column if it doesn't exist
            IF NOT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'llms'
                AND column_name = 'subdomain'
            ) THEN
                ALTER TABLE public.llms ADD COLUMN subdomain VARCHAR(255) NOT NULL DEFAULT 'public';
            END IF;
            
            -- Set the sequence if it exists
            IF EXISTS (
                SELECT FROM information_schema.sequences
                WHERE sequence_schema = 'dev'
                AND sequence_name = 'llms_id_seq'
            ) THEN
                -- Create the sequence in public schema
                CREATE SEQUENCE IF NOT EXISTS public.llms_id_seq;
                
                -- Get the current value from dev schema
                SELECT setval('public.llms_id_seq', nextval('dev.llms_id_seq'), false);
                
                -- Set the sequence as the default for id column
                ALTER TABLE public.llms ALTER COLUMN id SET DEFAULT nextval('public.llms_id_seq');
            END IF;
            
            RAISE NOTICE 'Created llms table in public schema from dev schema';
        ELSE
            -- Create a new llms table with basic structure
            CREATE TABLE public.llms (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                provider VARCHAR(255) NOT NULL,
                model VARCHAR(255) NOT NULL,
                api_key TEXT NOT NULL,
                temperature FLOAT NOT NULL DEFAULT 0.7,
                max_tokens INTEGER NOT NULL DEFAULT 1000,
                type_id INTEGER REFERENCES public.llm_types(id),
                additional_config JSONB,
                subdomain VARCHAR(255) NOT NULL DEFAULT 'public',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            RAISE NOTICE 'Created new llms table in public schema';
        END IF;
    ELSE
        -- Add the subdomain column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'llms'
            AND column_name = 'subdomain'
        ) THEN
            ALTER TABLE public.llms ADD COLUMN subdomain VARCHAR(255) NOT NULL DEFAULT 'public';
            RAISE NOTICE 'Added subdomain column to existing public.llms table';
        END IF;
    END IF;
END $$;

-- Migrate data from client schemas to public schema
DO $$
DECLARE
    client_schema text;
    llm_record record;
    existing_id integer;
BEGIN
    -- For each client schema (including dev)
    FOREACH client_schema IN ARRAY ARRAY['dev', 'conflict_club', 'first_congregational', 'bsa']
    LOOP
        -- Check if the schema exists
        IF EXISTS (
            SELECT FROM information_schema.schemata
            WHERE schema_name = client_schema
        ) THEN
            -- Check if the llms table exists in this schema
            IF EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = client_schema
                AND table_name = 'llms'
            ) THEN
                RAISE NOTICE 'Migrating llms from schema: %', client_schema;
                
                -- For each record in the client schema's llms table
                FOR llm_record IN
                    EXECUTE format('SELECT * FROM %I.llms', client_schema)
                LOOP
                    -- Check if this record already exists in public schema
                    EXECUTE format('
                        SELECT id FROM public.llms 
                        WHERE name = $1 AND provider = $2 AND model = $3
                    ') INTO existing_id USING llm_record.name, llm_record.provider, llm_record.model;
                    
                    IF existing_id IS NULL THEN
                        -- Insert the record into public schema with the client schema as subdomain
                        EXECUTE format('
                            INSERT INTO public.llms (
                                id, name, provider, model, api_key, temperature, max_tokens, 
                                type_id, additional_config, subdomain, created_at, updated_at
                            ) VALUES (
                                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
                            )
                        ') USING 
                            llm_record.id, 
                            llm_record.name, 
                            llm_record.provider, 
                            llm_record.model, 
                            llm_record.api_key, 
                            llm_record.temperature, 
                            llm_record.max_tokens, 
                            llm_record.type_id, 
                            llm_record.additional_config, 
                            client_schema, -- Use the client schema name as the subdomain
                            llm_record.created_at, 
                            llm_record.updated_at;
                            
                        RAISE NOTICE 'Migrated LLM % from schema % to public schema with subdomain %', 
                            llm_record.name, client_schema, client_schema;
                    ELSE
                        RAISE NOTICE 'LLM % already exists in public schema with ID %', 
                            llm_record.name, existing_id;
                    END IF;
                END LOOP;
            ELSE
                RAISE NOTICE 'No llms table found in schema: %', client_schema;
            END IF;
        ELSE
            RAISE NOTICE 'Schema does not exist: %', client_schema;
        END IF;
    END LOOP;
END $$;

-- Grant appropriate permissions
GRANT USAGE ON SCHEMA public TO PUBLIC;
GRANT SELECT ON public.llms TO PUBLIC;
GRANT SELECT ON public.llm_types TO PUBLIC;

-- Done!
SELECT 'Migration of llms table to public schema complete!' AS result;