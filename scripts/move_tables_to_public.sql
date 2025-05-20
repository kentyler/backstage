-- Script to move tables from dev schema to public schema
-- Tables to move: event_types, file_types, avatar_event_types, avatar_scopes

-- Start a transaction so we can roll back if needed
BEGIN;

-- Check if public schema exists, create if not
CREATE SCHEMA IF NOT EXISTS public;

-- Function to migrate a table from dev to public
CREATE OR REPLACE FUNCTION move_table_to_public(table_name text) RETURNS void AS $$
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
$$ LANGUAGE plpgsql;

-- Move the tables
SELECT move_table_to_public('event_types');
SELECT move_table_to_public('file_types');
SELECT move_table_to_public('avatar_event_types');
SELECT move_table_to_public('avatar_scopes');

-- Drop the helper function
DROP FUNCTION move_table_to_public(text);

-- Update foreign keys in all schemas that reference these tables in dev schema
DO $$
DECLARE
    fk_rec record;
    old_constraint_def text;
    new_constraint_def text;
    table_schema text;
    table_name text;
    constraint_name text;
BEGIN
    -- Loop through foreign keys that reference the moved tables in dev schema
    FOR fk_rec IN
        SELECT 
            n.nspname AS table_schema,
            c.relname AS table_name,
            con.conname AS constraint_name,
            pg_get_constraintdef(con.oid) AS constraint_def
        FROM pg_constraint con
        JOIN pg_class c ON con.conrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_class fc ON con.confrelid = fc.oid
        JOIN pg_namespace fn ON fc.relnamespace = fn.oid
        WHERE con.contype = 'f'
        AND fn.nspname = 'dev'
        AND fc.relname IN ('event_types', 'file_types', 'avatar_event_types', 'avatar_scopes')
    LOOP
        table_schema := fk_rec.table_schema;
        table_name := fk_rec.table_name;
        constraint_name := fk_rec.constraint_name;
        old_constraint_def := fk_rec.constraint_def;
        
        -- Replace dev schema reference with public schema
        new_constraint_def := replace(old_constraint_def, 'REFERENCES dev.', 'REFERENCES public.');
        
        -- Drop old constraint and create new one
        EXECUTE 'ALTER TABLE ' || quote_ident(table_schema) || '.' || quote_ident(table_name) || 
                ' DROP CONSTRAINT ' || quote_ident(constraint_name);
        
        EXECUTE 'ALTER TABLE ' || quote_ident(table_schema) || '.' || quote_ident(table_name) || 
                ' ADD CONSTRAINT ' || quote_ident(constraint_name) || ' ' || new_constraint_def;
                
        RAISE NOTICE 'Updated foreign key constraint % on %.% to reference public schema', 
                    constraint_name, table_schema, table_name;
    END LOOP;
END $$;

-- Update first_congregational foreign keys to point to public schema tables
DO $$
DECLARE
    fk_rec record;
    old_constraint_def text;
    new_constraint_def text;
    constraint_name text;
BEGIN
    -- Loop through foreign keys in first_congregational that reference the moved tables in dev schema
    FOR fk_rec IN
        SELECT 
            c.relname AS table_name,
            con.conname AS constraint_name,
            pg_get_constraintdef(con.oid) AS constraint_def
        FROM pg_constraint con
        JOIN pg_class c ON con.conrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_class fc ON con.confrelid = fc.oid
        JOIN pg_namespace fn ON fc.relnamespace = fn.oid
        WHERE con.contype = 'f'
        AND n.nspname = 'first_congregational'
        AND fn.nspname = 'dev'
        AND fc.relname IN ('event_types', 'file_types', 'avatar_event_types', 'avatar_scopes')
    LOOP
        constraint_name := fk_rec.constraint_name;
        old_constraint_def := fk_rec.constraint_def;
        
        -- Replace dev schema reference with public schema
        new_constraint_def := replace(old_constraint_def, 'REFERENCES dev.', 'REFERENCES public.');
        
        -- Drop old constraint and create new one
        EXECUTE 'ALTER TABLE first_congregational.' || quote_ident(fk_rec.table_name) || 
                ' DROP CONSTRAINT ' || quote_ident(constraint_name);
        
        EXECUTE 'ALTER TABLE first_congregational.' || quote_ident(fk_rec.table_name) || 
                ' ADD CONSTRAINT ' || quote_ident(constraint_name) || ' ' || new_constraint_def;
                
        RAISE NOTICE 'Updated foreign key constraint % on first_congregational.% to reference public schema', 
                    constraint_name, fk_rec.table_name;
    END LOOP;
END $$;

-- Report on what tables were moved and verify data counts match
SELECT 'public' AS schema, t.table_name, 
       (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.table_name) > 0 AS table_exists,
       CASE 
           WHEN t.table_name = 'event_types' THEN (SELECT count(*) FROM public.event_types)
           WHEN t.table_name = 'file_types' THEN (SELECT count(*) FROM public.file_types)
           WHEN t.table_name = 'avatar_event_types' THEN (SELECT count(*) FROM public.avatar_event_types)
           WHEN t.table_name = 'avatar_scopes' THEN (SELECT count(*) FROM public.avatar_scopes)
       END AS row_count,
       CASE 
           WHEN t.table_name = 'event_types' THEN (SELECT count(*) FROM dev.event_types)
           WHEN t.table_name = 'file_types' THEN (SELECT count(*) FROM dev.file_types)
           WHEN t.table_name = 'avatar_event_types' THEN (SELECT count(*) FROM dev.avatar_event_types)
           WHEN t.table_name = 'avatar_scopes' THEN (SELECT count(*) FROM dev.avatar_scopes)
       END AS dev_row_count
FROM (VALUES ('event_types'), ('file_types'), ('avatar_event_types'), ('avatar_scopes')) t(table_name);

-- Commit the transaction if all went well
COMMIT;
