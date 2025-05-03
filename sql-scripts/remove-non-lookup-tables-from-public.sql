-- SQL script to remove non-lookup tables from public schema
-- This script:
-- 1. Identifies which tables are non-lookup tables
-- 2. Checks that these tables exist in client schemas
-- 3. Removes the non-lookup tables from the public schema
-- 4. Provides informative output about the process

-- Define which tables are lookup tables
CREATE TEMP TABLE lookup_tables (table_name text);
INSERT INTO lookup_tables 
SELECT information_schema.tables.table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND (information_schema.tables.table_name LIKE '%types' OR information_schema.tables.table_name = 'turn_kinds');

-- Define which tables are non-lookup tables
CREATE TEMP TABLE non_lookup_tables (table_name text);
INSERT INTO non_lookup_tables 
SELECT information_schema.tables.table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND NOT EXISTS (
    SELECT 1 FROM lookup_tables WHERE lookup_tables.table_name = information_schema.tables.table_name
);

-- Check that all non-lookup tables exist in the dev schema
DO $$
DECLARE
    tbl_name text;
    missing_tables text := '';
BEGIN
    FOR tbl_name IN 
        SELECT table_name FROM non_lookup_tables
    LOOP
        -- Check if the table exists in the dev schema
        PERFORM 1
        FROM information_schema.tables
        WHERE table_schema = 'dev'
        AND table_name = tbl_name;
        
        IF NOT FOUND THEN
            missing_tables := missing_tables || tbl_name || ', ';
        END IF;
    END LOOP;
    
    -- If any tables are missing, raise an exception
    IF missing_tables <> '' THEN
        RAISE EXCEPTION 'The following tables do not exist in the dev schema: %', missing_tables;
    END IF;
END $$;

-- Drop non-lookup tables from public schema
DO $$
DECLARE
    tbl_name text;
BEGIN
    FOR tbl_name IN 
        SELECT table_name FROM non_lookup_tables
    LOOP
        EXECUTE format('DROP TABLE public.%I CASCADE', tbl_name);
        RAISE NOTICE 'Dropped table: public.%', tbl_name;
    END LOOP;
END $$;

-- Done!
SELECT 'Non-lookup tables removal complete!' AS result;
SELECT 'The following tables were kept in public schema:' AS lookup_tables;
SELECT table_name FROM lookup_tables;
SELECT 'The following tables were removed from public schema:' AS non_lookup_tables;
SELECT table_name FROM non_lookup_tables;