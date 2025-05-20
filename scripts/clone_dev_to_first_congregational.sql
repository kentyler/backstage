-- Script to clone the 'dev' schema to 'first_congregational'
-- This script follows the pattern used in your database architecture,
-- based on the schema files we examined

-- Start a transaction so we can roll back if needed
BEGIN;

-- Create or replace the target schema
DROP SCHEMA IF EXISTS first_congregational CASCADE;
CREATE SCHEMA first_congregational;

-- Create the required extensions (already exists at database level)
-- These lines might be unnecessary but included for completeness
-- CREATE EXTENSION IF NOT EXISTS ltree WITH SCHEMA public;
-- CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
-- CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Get a list of tables, sequences, and other objects from dev schema
DO $$
DECLARE
    func_record RECORD;
    seq_record RECORD;
    table_record RECORD;
    view_record RECORD;
    cmd TEXT;
BEGIN
    -- Create sequences first
    FOR seq_record IN 
        SELECT sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'dev'
        ORDER BY sequencename
    LOOP
        RAISE NOTICE 'Creating sequence: %.%', 'first_congregational', seq_record.sequencename;
        cmd := format('CREATE SEQUENCE first_congregational.%I', seq_record.sequencename);
        EXECUTE cmd;
    END LOOP;
    
    -- Create tables
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'dev'
        ORDER BY tablename
    LOOP
        RAISE NOTICE 'Creating table: %.%', 'first_congregational', table_record.tablename;
        cmd := format(
            'CREATE TABLE first_congregational.%I (LIKE dev.%I INCLUDING ALL)',
            table_record.tablename,
            table_record.tablename
        );
        EXECUTE cmd;
    END LOOP;
    
    -- Set default values using sequences
    FOR table_record IN 
        SELECT
            c.relname AS tablename,
            a.attname AS columnname,
            pg_get_expr(d.adbin, d.adrelid) AS default_value
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_attribute a ON c.oid = a.attrelid
        JOIN pg_attrdef d ON c.oid = d.adrelid AND a.attnum = d.adnum
        WHERE n.nspname = 'dev'
        AND pg_get_expr(d.adbin, d.adrelid) LIKE 'nextval%'
    LOOP
        IF table_record.default_value LIKE '%dev.%' THEN
            -- Replace dev schema with first_congregational in default value
            cmd := format(
                'ALTER TABLE first_congregational.%I ALTER COLUMN %I SET DEFAULT %s',
                table_record.tablename,
                table_record.columnname,
                replace(table_record.default_value, 'dev.', 'first_congregational.')
            );
            EXECUTE cmd;
        END IF;
    END LOOP;
    
    -- Create views
    FOR view_record IN
        SELECT viewname, definition
        FROM pg_views
        WHERE schemaname = 'dev'
    LOOP
        RAISE NOTICE 'Creating view: %.%', 'first_congregational', view_record.viewname;
        
        BEGIN
            -- Replace all references to dev schema with first_congregational
            cmd := replace(view_record.definition, 'dev.', 'first_congregational.');
            
            -- Create the view
            EXECUTE format(
                'CREATE OR REPLACE VIEW first_congregational.%I AS %s',
                view_record.viewname,
                cmd
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error creating view %: %', view_record.viewname, SQLERRM;
        END;
    END LOOP;
    
    -- Create foreign keys and other constraints
    FOR table_record IN
        SELECT 
            conrelid::regclass::text AS table_name,
            conname AS constraint_name,
            pg_get_constraintdef(oid) AS constraint_def
        FROM pg_constraint
        WHERE connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'dev')
        AND contype = 'f'  -- foreign key constraints
    LOOP
        -- Extract just the table name without the schema prefix
        table_record.table_name := replace(table_record.table_name, 'dev.', '');
        
        -- Replace all references to dev schema with first_congregational
        cmd := replace(table_record.constraint_def, 'dev.', 'first_congregational.');
        
        BEGIN
            EXECUTE format(
                'ALTER TABLE first_congregational.%I ADD CONSTRAINT %I %s',
                table_record.table_name,
                table_record.constraint_name,
                cmd
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error creating constraint %: %', table_record.constraint_name, SQLERRM;
        END;
    END LOOP;
    
    -- Set sequence ownership
    FOR seq_record IN
        SELECT
            n.nspname AS schema,
            s.relname AS sequence,
            t.relname AS table,
            a.attname AS column
        FROM pg_class s
        JOIN pg_namespace n ON n.oid = s.relnamespace
        JOIN pg_depend d ON d.objid = s.oid
        JOIN pg_class t ON d.refobjid = t.oid
        JOIN pg_attribute a ON (d.refobjid, d.refobjsubid) = (a.attrelid, a.attnum)
        WHERE s.relkind = 'S' AND n.nspname = 'dev'
    LOOP
        RAISE NOTICE 'Setting sequence ownership: %.% owned by %.%.%',
            'first_congregational', seq_record.sequence,
            'first_congregational', seq_record.table, seq_record.column;
            
        BEGIN
            EXECUTE format(
                'ALTER SEQUENCE first_congregational.%I OWNED BY first_congregational.%I.%I',
                seq_record.sequence,
                seq_record.table,
                seq_record.column
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error setting sequence ownership for %: %', seq_record.sequence, SQLERRM;
        END;
    END LOOP;
END $$;

-- Verify what was created
SELECT 'first_congregational schema' AS schema_name,
       (SELECT count(*) FROM pg_tables WHERE schemaname = 'first_congregational') AS table_count,
       (SELECT count(*) FROM pg_sequences WHERE schemaname = 'first_congregational') AS sequence_count,
       (SELECT count(*) FROM pg_views WHERE schemaname = 'first_congregational') AS view_count;

-- Complete the transaction
COMMIT;
