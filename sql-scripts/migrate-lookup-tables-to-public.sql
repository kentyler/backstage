-- SQL script to migrate lookup tables to public schema
-- This script:
-- 1. Identifies lookup tables (ending with 'types' or named 'turn_kinds')
-- 2. Ensures these tables exist in the public schema with all data
-- 3. Deletes these tables from the client schemas
-- 4. Sets up appropriate permissions for client schemas to access the public lookup tables

-- Define which tables are lookup tables
CREATE TEMP TABLE lookup_tables (table_name text);
INSERT INTO lookup_tables 
SELECT information_schema.tables.table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND (information_schema.tables.table_name LIKE '%types' OR information_schema.tables.table_name = 'turn_kinds');

-- Grant usage on public schema to all client schemas
DO $$
BEGIN
    EXECUTE 'GRANT USAGE ON SCHEMA public TO PUBLIC';
END $$;

-- Process each client schema
DO $$
DECLARE
    client_schema text;
    tbl_name text;
    column_info record;
    column_list text;
    insert_query text;
BEGIN
    -- For each client schema
    FOREACH client_schema IN ARRAY ARRAY['conflict_club', 'first_congregational', 'bsa']
    LOOP
        RAISE NOTICE 'Processing schema: %', client_schema;
        
        -- For each lookup table
        FOR tbl_name IN 
            SELECT table_name FROM lookup_tables
        LOOP
            -- Check if the lookup table exists in the client schema
            PERFORM 1
            FROM information_schema.tables
            WHERE table_schema = client_schema
            AND table_name = tbl_name;
            
            IF FOUND THEN
                RAISE NOTICE 'Processing lookup table: %.%', client_schema, tbl_name;
                
                -- Grant SELECT permission on the public lookup table
                EXECUTE format('GRANT SELECT ON public.%I TO PUBLIC', tbl_name);
                
                -- Drop the lookup table from the client schema
                EXECUTE format('DROP TABLE %I.%I', client_schema, tbl_name);
                RAISE NOTICE 'Dropped lookup table: %.%', client_schema, tbl_name;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Done!
SELECT 'Lookup tables migration complete!' AS result;
SELECT 'Lookup tables (now only in public schema):' AS lookup_tables;
SELECT table_name FROM lookup_tables;