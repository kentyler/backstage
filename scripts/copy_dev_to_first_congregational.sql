-- Script to copy the dev schema structure to first-congregational schema
-- This script copies all tables, sequences, views, indexes, and constraints

-- Make sure we're in a transaction so we can roll back if something goes wrong
BEGIN;

-- Create extensions if they don't exist
-- These are schema-independent but critical for the application
CREATE EXTENSION IF NOT EXISTS ltree WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Function to copy a schema structure without data
-- Adapted from https://wiki.postgresql.org/wiki/Clone_schema
CREATE OR REPLACE FUNCTION clone_schema(source_schema text, dest_schema text, include_recs boolean) RETURNS void AS
$$
DECLARE
  object text;
  buffer text;
  default_val text;
  column_rec record;
  constraint_rec record;
  trigger_rec record;
  index_rec record;
  seq_rec record;
BEGIN
  -- First, make sure destination schema exists
  EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || quote_ident(dest_schema);
  
  -- Get sequences
  FOR object IN
    SELECT sequence_name::text FROM information_schema.sequences WHERE sequence_schema = source_schema
  LOOP
    EXECUTE 'CREATE SEQUENCE ' || quote_ident(dest_schema) || '.' || quote_ident(object);
    
    -- Set the current value if including records
    IF include_recs THEN
      EXECUTE 'SELECT last_value FROM ' || quote_ident(source_schema) || '.' || quote_ident(object) INTO buffer;
      EXECUTE 'SELECT setval(' || quote_literal(quote_ident(dest_schema) || '.' || quote_ident(object)) || ', ' || buffer || ', true)';
    END IF;
  END LOOP;

  -- Get tables
  FOR object IN
    SELECT table_name::text FROM information_schema.tables 
    WHERE table_schema = source_schema AND table_type = 'BASE TABLE'
  LOOP
    buffer := dest_schema || '.' || object;
    
    -- Create table structure
    EXECUTE 'CREATE TABLE ' || buffer || ' (LIKE ' || quote_ident(source_schema) || '.' || quote_ident(object) || ' INCLUDING ALL)';
    
    -- Copy data if requested
    IF include_recs THEN
      EXECUTE 'INSERT INTO ' || buffer || ' SELECT * FROM ' || quote_ident(source_schema) || '.' || quote_ident(object);
    END IF;
    
    -- Set ownership of sequences used by the table
    FOR column_rec IN
      SELECT column_name, column_default 
      FROM information_schema.columns 
      WHERE table_schema = dest_schema AND table_name = object AND column_default LIKE 'nextval%'
    LOOP
      default_val := column_rec.column_default;
      default_val := substr(default_val, 10, length(default_val) - 11); -- Strip nextval('...')
      
      -- If sequence name includes source_schema, replace with dest_schema
      IF default_val LIKE source_schema || '.%' THEN
        default_val := replace(default_val, source_schema, dest_schema);
        
        -- Update the sequence default
        EXECUTE 'ALTER TABLE ' || buffer || ' ALTER COLUMN ' || quote_ident(column_rec.column_name) || 
                ' SET DEFAULT nextval(' || quote_literal(default_val) || ')';
      END IF;
    END LOOP;
  END LOOP;

  -- Get views
  FOR object IN
    SELECT table_name::text FROM information_schema.tables 
    WHERE table_schema = source_schema AND table_type = 'VIEW'
  LOOP
    -- Get view definition
    SELECT pg_get_viewdef(quote_ident(source_schema) || '.' || quote_ident(object), true) INTO buffer;
    
    -- Create view in dest schema
    EXECUTE 'CREATE OR REPLACE VIEW ' || quote_ident(dest_schema) || '.' || quote_ident(object) || ' AS ' || buffer;
  END LOOP;

END;
$$ LANGUAGE plpgsql;

-- Use the function to copy schema structure (without data)
SELECT clone_schema('dev', 'first_congregational', false);

-- Drop the function after use
DROP FUNCTION clone_schema(text, text, boolean);

-- Make sure all constraints are properly created
DO $$
DECLARE
  cmd text;
  r record;
BEGIN
  -- Copy foreign keys
  FOR r IN 
    SELECT conname, pg_get_constraintdef(c.oid) as constraintdef, relname as tablename
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'dev' AND c.contype = 'f'
  LOOP
    -- Create the same foreign key in the new schema
    cmd := 'ALTER TABLE first_congregational.' || quote_ident(r.tablename) || 
           ' ADD CONSTRAINT ' || quote_ident(r.conname) || ' ' || 
           replace(r.constraintdef, ' dev.', ' first_congregational.');
    
    -- Wrap in try-catch to handle cases where the referenced table might be in another schema
    BEGIN
      EXECUTE cmd;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to create constraint %: %', r.conname, SQLERRM;
    END;
  END LOOP;
  
  -- Copy indexes (excluding primary keys and unique constraints which were already handled by "INCLUDING ALL")
  FOR r IN 
    SELECT indexname, tablename, indexdef
    FROM pg_indexes
    WHERE schemaname = 'dev'
    AND indexname NOT IN (
      SELECT conname FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      WHERE n.nspname = 'dev' AND (c.contype = 'p' OR c.contype = 'u')
    )
  LOOP
    -- Create the same index in the new schema
    cmd := replace(r.indexdef, ' dev.', ' first_congregational.');
    cmd := replace(cmd, 'CREATE INDEX', 'CREATE INDEX IF NOT EXISTS');
    
    BEGIN
      EXECUTE cmd;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to create index %: %', r.indexname, SQLERRM;
    END;
  END LOOP;
  
  -- Copy triggers
  FOR r IN 
    SELECT t.tgname, pg_get_triggerdef(t.oid) AS triggerdef
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'dev' AND NOT t.tgisinternal
  LOOP
    cmd := replace(r.triggerdef, ' ON dev.', ' ON first_congregational.');
    
    BEGIN
      EXECUTE cmd;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to create trigger %: %', r.tgname, SQLERRM;
    END;
  END LOOP;

END $$;

-- Fix sequences to be owned by their respective columns
DO $$
DECLARE
  cmd text;
  r record;
BEGIN
  FOR r IN 
    SELECT
      a.attname as column_name,
      s.relname as sequence_name,
      t.relname as table_name
    FROM pg_class s
    JOIN pg_depend d ON d.objid = s.oid
    JOIN pg_class t ON d.refobjid = t.oid
    JOIN pg_attribute a ON (d.refobjid, d.refobjsubid) = (a.attrelid, a.attnum)
    JOIN pg_namespace n ON n.oid = s.relnamespace
    WHERE s.relkind = 'S'
    AND n.nspname = 'dev'
    AND d.deptype = 'a'
  LOOP
    cmd := 'ALTER SEQUENCE first_congregational.' || quote_ident(r.sequence_name) || 
           ' OWNED BY first_congregational.' || quote_ident(r.table_name) || '.' || quote_ident(r.column_name);
    
    BEGIN
      EXECUTE cmd;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to set sequence ownership %: %', r.sequence_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- Commit the transaction
COMMIT;

-- Verify what was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'first_congregational' 
ORDER BY table_name;
