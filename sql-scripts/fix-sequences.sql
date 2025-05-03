-- SQL script to fix sequences in schemas
-- This script:
-- 1. Checks for existing sequences in the target schema
-- 2. Creates sequences if they don't exist
-- 3. Sets the correct ownership of sequences to their respective tables
-- 4. Sets the sequence values to match the current max values in the tables
-- 5. Sets the DEFAULT value for the ID columns to use the sequences

-- Usage: This script expects a 'schema_name' parameter to be provided
-- The JavaScript script will replace '${schema_name}' with the actual schema name

DO $$
DECLARE
    tbl_name text;
    seq_name text;
    max_id bigint;
    schema_var text := '${schema_name}';
BEGIN
    RAISE NOTICE 'Fixing sequences in schema: %', schema_var;
    
    -- Loop through all tables in the schema that likely have an ID column
    FOR tbl_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = schema_var
        AND table_type = 'BASE TABLE'
    LOOP
        -- Check if the table has an id column
        PERFORM 1
        FROM information_schema.columns
        WHERE table_schema = schema_var
        AND table_name = tbl_name
        AND column_name = 'id';
        
        IF FOUND THEN
            -- Construct the sequence name (standard PostgreSQL naming convention)
            seq_name := tbl_name || '_id_seq';
            
            -- Check if the sequence exists
            PERFORM 1
            FROM information_schema.sequences
            WHERE sequence_schema = schema_var
            AND sequence_name = seq_name;
            
            IF NOT FOUND THEN
                -- Create the sequence if it doesn't exist
                EXECUTE format('CREATE SEQUENCE %I.%I', schema_var, seq_name);
                RAISE NOTICE 'Created sequence %', seq_name;
            END IF;
            
            -- Set the sequence as the default for the id column
            EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN id SET DEFAULT nextval(''%I.%I'')', 
                          schema_var, tbl_name, schema_var, seq_name);
            
            -- Set the sequence ownership
            EXECUTE format('ALTER SEQUENCE %I.%I OWNED BY %I.%I.id', 
                          schema_var, seq_name, schema_var, tbl_name);
            
            -- Get the maximum id value from the table
            EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM %I.%I', schema_var, tbl_name) INTO max_id;
            
            -- Set the sequence to start from the next value after the maximum id
            IF max_id > 0 THEN
                EXECUTE format('SELECT setval(''%I.%I'', %s, true)', 
                              schema_var, seq_name, max_id);
                RAISE NOTICE 'Set sequence % to start from % for table %', seq_name, max_id + 1, tbl_name;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Sequence fixing complete for schema: %', schema_var;
END $$;