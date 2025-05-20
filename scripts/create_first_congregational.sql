-- Direct script to create first_congregational schema using dev schema structure
-- No variables, all direct SQL commands

-- Drop and recreate the schema
DROP SCHEMA IF EXISTS first_congregational CASCADE;
CREATE SCHEMA first_congregational;

-- Copy all tables, sequences, views, and constraints from dev schema
-- Including all data types, defaults, constraints, and indexes

-- This uses a temporary function to do the work and then drops the function
DO $$
DECLARE
    obj record;
    sql text;
BEGIN
    -- Create sequences
    FOR obj IN 
        SELECT sequence_schema, sequence_name, 
               data_type, start_value, 
               minimum_value, maximum_value, 
               increment, cycle_option
        FROM information_schema.sequences
        WHERE sequence_schema = 'dev'
    LOOP
        EXECUTE 'CREATE SEQUENCE first_congregational.' || obj.sequence_name || 
                ' INCREMENT ' || obj.increment || 
                ' MINVALUE ' || obj.minimum_value || 
                ' MAXVALUE ' || obj.maximum_value || 
                ' START ' || obj.start_value || 
                CASE WHEN obj.cycle_option = 'YES' THEN ' CYCLE' ELSE ' NO CYCLE' END;
    END LOOP;

    -- Create tables
    FOR obj IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'dev' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE 'CREATE TABLE first_congregational.' || obj.table_name || 
                ' (LIKE dev.' || obj.table_name || ' INCLUDING ALL)';
    END LOOP;

    -- Update sequence ownership and default values
    FOR obj IN 
        SELECT
            c.relname AS tablename,
            a.attname AS columnname,
            pg_get_expr(d.adbin, d.adrelid) AS default_value,
            replace(pg_get_expr(d.adbin, d.adrelid), 'dev.', 'first_congregational.') AS new_default
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_attribute a ON c.oid = a.attrelid
        JOIN pg_attrdef d ON c.oid = d.adrelid AND a.attnum = d.adnum
        WHERE n.nspname = 'dev'
        AND pg_get_expr(d.adbin, d.adrelid) LIKE 'nextval%'
    LOOP
        EXECUTE 'ALTER TABLE first_congregational.' || obj.tablename || 
                ' ALTER COLUMN ' || obj.columnname || 
                ' SET DEFAULT ' || obj.new_default;
    END LOOP;

    -- Create views
    FOR obj IN 
        SELECT viewname, definition
        FROM pg_views
        WHERE schemaname = 'dev'
    LOOP
        sql := replace(obj.definition, 'dev.', 'first_congregational.');
        
        BEGIN
            EXECUTE 'CREATE OR REPLACE VIEW first_congregational.' || obj.viewname || ' AS ' || sql;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error creating view %: %', obj.viewname, SQLERRM;
        END;
    END LOOP;

    -- Create indexes (excluding primary keys and unique constraints which were included with LIKE ... INCLUDING ALL)
    FOR obj IN 
        SELECT
            i.relname AS indexname,
            t.relname AS tablename,
            pg_get_indexdef(i.oid) AS indexdef
        FROM pg_index x
        JOIN pg_class i ON i.oid = x.indexrelid
        JOIN pg_class t ON t.oid = x.indrelid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        LEFT JOIN pg_constraint c ON x.indexrelid = c.conindid
        WHERE n.nspname = 'dev'
        AND c.conindid IS NULL
        AND NOT x.indisprimary
        AND NOT x.indisunique
    LOOP
        BEGIN
            sql := replace(obj.indexdef, 'dev.', 'first_congregational.');
            EXECUTE sql;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error creating index %: %', obj.indexname, SQLERRM;
        END;
    END LOOP;

    -- Create foreign keys
    FOR obj IN 
        SELECT
            conname AS constraint_name,
            conrelid::regclass::text AS table_name,
            pg_get_constraintdef(oid) AS constraint_def
        FROM pg_constraint
        WHERE connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'dev')
        AND contype = 'f'
    LOOP
        -- Extract just the table name without the schema prefix
        obj.table_name := regexp_replace(obj.table_name, '^dev\.', '');
        
        BEGIN
            sql := replace(obj.constraint_def, 'dev.', 'first_congregational.');
            EXECUTE 'ALTER TABLE first_congregational.' || obj.table_name || 
                    ' ADD CONSTRAINT ' || obj.constraint_name || ' ' || sql;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error creating constraint %: %', obj.constraint_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Output the structure that was created
SELECT 'Schema copy completed' as status;
SELECT schemaname, count(*) as tables_count 
FROM pg_tables 
WHERE schemaname = 'first_congregational' 
GROUP BY schemaname;

SELECT schemaname, count(*) as sequences_count
FROM pg_sequences
WHERE schemaname = 'first_congregational'
GROUP BY schemaname;
