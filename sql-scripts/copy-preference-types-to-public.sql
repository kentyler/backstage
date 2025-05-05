-- SQL script to copy the preference_types table and its records from 'dev' to the 'public' schema
-- This script:
-- 1. Creates the preference_types table in the public schema if it doesn't exist
-- 2. Copies all records from dev.preference_types to public.preference_types
-- 3. Sets up the appropriate sequence if one exists
-- 4. Grants appropriate permissions

-- Create the preference_types table in the public schema if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'preference_types'
    ) THEN
        -- Check if it exists in dev schema
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'dev' 
            AND table_name = 'preference_types'
        ) THEN
            -- Create the table structure in public schema based on dev schema
            CREATE TABLE public.preference_types (
                LIKE dev.preference_types INCLUDING ALL
            );
            
            -- Set the sequence if it exists
            IF EXISTS (
                SELECT FROM information_schema.sequences
                WHERE sequence_schema = 'dev'
                AND sequence_name = 'preference_types_id_seq'
            ) THEN
                -- Create the sequence in public schema
                CREATE SEQUENCE IF NOT EXISTS public.preference_types_id_seq;
                
                -- Get the current value from dev schema
                SELECT setval('public.preference_types_id_seq', nextval('dev.preference_types_id_seq'), false);
                
                -- Set the sequence as the default for id column
                ALTER TABLE public.preference_types ALTER COLUMN id SET DEFAULT nextval('public.preference_types_id_seq');
            END IF;
            
            RAISE NOTICE 'Created preference_types table in public schema from dev schema';
        ELSE
            RAISE EXCEPTION 'preference_types table not found in dev schema';
        END IF;
    ELSE
        RAISE NOTICE 'preference_types table already exists in public schema';
    END IF;
END $$;

-- Copy all records from dev.preference_types to public.preference_types
DO $$
DECLARE
    preference_type_record record;
    existing_id integer;
BEGIN
    -- Check if the dev schema exists
    IF EXISTS (
        SELECT FROM information_schema.schemata
        WHERE schema_name = 'dev'
    ) THEN
        -- Check if the preference_types table exists in the dev schema
        IF EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'dev'
            AND table_name = 'preference_types'
        ) THEN
            RAISE NOTICE 'Copying records from dev.preference_types to public.preference_types...';
            
            -- For each record in dev.preference_types
            FOR preference_type_record IN
                SELECT * FROM dev.preference_types
            LOOP
                -- Check if this record already exists in public schema
                EXECUTE format('
                    SELECT id FROM public.preference_types 
                    WHERE id = $1
                ') INTO existing_id USING preference_type_record.id;
                
                IF existing_id IS NULL THEN
                    -- Insert the record into public schema
                    EXECUTE format('
                        INSERT INTO public.preference_types (
                            id, name, description, created_at, updated_at
                        ) VALUES (
                            $1, $2, $3, $4, $5
                        )
                    ') USING 
                        preference_type_record.id, 
                        preference_type_record.name, 
                        preference_type_record.description, 
                        preference_type_record.created_at, 
                        preference_type_record.updated_at;
                        
                    RAISE NOTICE 'Copied preference type % from dev schema to public schema', 
                        preference_type_record.name;
                ELSE
                    RAISE NOTICE 'Preference type % already exists in public schema with ID %', 
                        preference_type_record.name, existing_id;
                END IF;
            END LOOP;
        ELSE
            RAISE NOTICE 'No preference_types table found in dev schema';
        END IF;
    ELSE
        RAISE NOTICE 'Dev schema does not exist';
    END IF;
END $$;

-- Grant appropriate permissions
GRANT USAGE ON SCHEMA public TO PUBLIC;
GRANT SELECT ON public.preference_types TO PUBLIC;

-- Done!
SELECT 'Copy of preference_types from dev schema to public schema complete!' AS result;