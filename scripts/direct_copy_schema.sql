-- Direct copying script for schema transfer from dev to first_congregational

-- First, check what tables exist in the dev schema
SELECT 'Tables in dev schema:' AS description;
SELECT tablename FROM pg_tables WHERE schemaname = 'dev';

-- Now for sequences
SELECT 'Sequences in dev schema:' AS description;
SELECT sequencename FROM pg_sequences WHERE schemaname = 'dev';

-- Let's try a direct approach
DO $$
DECLARE
    tables_cursor CURSOR FOR 
        SELECT tablename FROM pg_tables WHERE schemaname = 'dev';
    views_cursor CURSOR FOR 
        SELECT viewname, definition FROM pg_views WHERE schemaname = 'dev';
    sequences_cursor CURSOR FOR 
        SELECT sequencename FROM pg_sequences WHERE schemaname = 'dev';
    table_name text;
    view_name text;
    view_def text;
    seq_name text;
BEGIN
    -- Clear out any existing objects in first_congregational schema
    DROP SCHEMA IF EXISTS first_congregational CASCADE;
    
    -- Recreate the schema
    CREATE SCHEMA first_congregational;
    
    -- Copy tables
    OPEN tables_cursor;
    LOOP
        FETCH tables_cursor INTO table_name;
        EXIT WHEN NOT FOUND;
        
        RAISE NOTICE 'Creating table: first_congregational.%', table_name;
        EXECUTE 'CREATE TABLE first_congregational.' || quote_ident(table_name) || 
                ' (LIKE dev.' || quote_ident(table_name) || ' INCLUDING ALL)';
    END LOOP;
    CLOSE tables_cursor;
    
    -- Copy sequences
    OPEN sequences_cursor;
    LOOP
        FETCH sequences_cursor INTO seq_name;
        EXIT WHEN NOT FOUND;
        
        RAISE NOTICE 'Creating sequence: first_congregational.%', seq_name;
        EXECUTE 'CREATE SEQUENCE IF NOT EXISTS first_congregational.' || quote_ident(seq_name);
    END LOOP;
    CLOSE sequences_cursor;
    
    -- Copy views (after tables are created)
    OPEN views_cursor;
    LOOP
        FETCH views_cursor INTO view_name, view_def;
        EXIT WHEN NOT FOUND;
        
        RAISE NOTICE 'Creating view: first_congregational.%', view_name;
        BEGIN
            -- Replace dev schema with first_congregational in the view definition
            view_def := replace(view_def, ' dev.', ' first_congregational.');
            EXECUTE 'CREATE OR REPLACE VIEW first_congregational.' || quote_ident(view_name) || 
                    ' AS ' || view_def;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to create view %: %', view_name, SQLERRM;
        END;
    END LOOP;
    CLOSE views_cursor;
    
    -- Output count of created objects
    RAISE NOTICE 'Schema transfer completed';
END $$;

-- Verify what was created
SELECT 'Tables in first_congregational schema:' AS description;
SELECT tablename FROM pg_tables WHERE schemaname = 'first_congregational';

SELECT 'Sequences in first_congregational schema:' AS description;
SELECT sequencename FROM pg_sequences WHERE schemaname = 'first_congregational';

SELECT 'Views in first_congregational schema:' AS description;
SELECT viewname FROM pg_views WHERE schemaname = 'first_congregational';
