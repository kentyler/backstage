-- SQL script to set up multi-tenancy with specific schemas
-- This script:
-- 1. Creates a 'dev' schema with all existing data from the public schema
-- 2. Creates client schemas with only lookup data
-- 3. Sets up sequences correctly in all schemas

-- Step 1: Create the 'dev' schema with all existing data
CREATE SCHEMA dev;

-- Copy all tables from public to dev schema
DO $$
DECLARE
    tbl_name text;
    seq_name text;
    last_val bigint;
BEGIN
    -- For each table in public schema
    FOR tbl_name IN 
        SELECT information_schema.tables.table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        -- Create table in dev schema
        EXECUTE format('CREATE TABLE dev.%I (LIKE public.%I INCLUDING ALL)', 
                      tbl_name, tbl_name);
        
        -- Copy data
        EXECUTE format('INSERT INTO dev.%I SELECT * FROM public.%I', 
                      tbl_name, tbl_name);
    END LOOP;
    
    -- Copy sequences
    FOR seq_name IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE format('CREATE SEQUENCE dev.%I', seq_name);
        EXECUTE format('SELECT last_value FROM public.%I', seq_name) INTO last_val;
        EXECUTE format('SELECT setval(''dev.%I'', %s, true)', seq_name, last_val);
    END LOOP;
END $$;

        -- For each table in public schema that is NOT a lookup table
        FOR tbl_name IN 
            SELECT information_schema.tables.table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            AND NOT EXISTS (
                SELECT 1 FROM lookup_tables WHERE lookup_tables.table_name = information_schema.tables.table_name
            )
        LOOP
            -- Create the table in the client schema
            EXECUTE format('CREATE TABLE %I.%I (LIKE public.%I INCLUDING ALL)', 
                          client_schema, tbl_name, tbl_name);
        END LOOP;
        
        -- Grant SELECT permission on lookup tables in public schema
        FOR tbl_name IN 
            SELECT table_name FROM lookup_tables
        LOOP
            EXECUTE format('GRANT SELECT ON public.%I TO PUBLIC', tbl_name);
            RAISE NOTICE 'Granted SELECT on lookup table: %', tbl_name;
        END LOOP;

-- Create client schemas
DO $$
DECLARE
    client_schema text;
    tbl_name text;
    is_lookup boolean;
    seq_name text;
    last_val bigint;
BEGIN
    -- For each client schema
    FOREACH client_schema IN ARRAY ARRAY['conflict_club', 'first_congregational', 'bsa']
    LOOP
        -- Create the schema
        EXECUTE format('CREATE SCHEMA %I', client_schema);
        
        -- For each table in public schema
        FOR tbl_name IN 
            SELECT information_schema.tables.table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        LOOP
            -- Check if it's a lookup table
            SELECT EXISTS (
                SELECT 1 FROM lookup_tables WHERE lookup_tables.table_name = tbl_name
            ) INTO is_lookup;
            
            -- Create the table in the client schema
            EXECUTE format('CREATE TABLE %I.%I (LIKE public.%I INCLUDING ALL)', 
                          client_schema, tbl_name, tbl_name);
            
            -- If it's a lookup table, copy the data
            IF is_lookup THEN
                EXECUTE format('INSERT INTO %I.%I SELECT * FROM public.%I', 
                              client_schema, tbl_name, tbl_name);
                RAISE NOTICE 'Copied data for lookup table: %', tbl_name;
            END IF;
        END LOOP;
        
        -- Create sequences
        FOR seq_name IN 
            SELECT sequence_name 
            FROM information_schema.sequences 
            WHERE sequence_schema = 'public'
        LOOP
            EXECUTE format('CREATE SEQUENCE %I.%I', client_schema, seq_name);
            EXECUTE format('SELECT last_value FROM public.%I', seq_name) INTO last_val;
            EXECUTE format('SELECT setval(''%I.%I'', %s, true)', 
                          client_schema, seq_name, last_val);
        END LOOP;
        
        RAISE NOTICE 'Created schema: %', client_schema;
    END LOOP;
END $$;

-- Step 3: Set search_path for the current session back to public
SET search_path TO public;

-- Done!
SELECT 'Multi-tenancy setup complete!' AS result;
SELECT 'Created schemas: dev, conflict_club, first_congregational, bsa' AS schemas;
SELECT 'Lookup tables (kept in public schema):' AS lookup_tables;
SELECT table_name FROM lookup_tables;