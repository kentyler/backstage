-- Step 1: Create group_types table in public schema
CREATE TABLE public.group_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Insert initial group types
INSERT INTO public.group_types (name, description) VALUES 
('discussion', 'Standard discussion group'),
('course', 'Educational course with lessons and topics');

-- Step 3: Get all schemas except system schemas
DO $$
DECLARE
  schema_name text;
BEGIN
  -- Loop through all non-system schemas
  FOR schema_name IN 
    SELECT nspname 
    FROM pg_namespace 
    WHERE nspname NOT LIKE 'pg_%' 
      AND nspname != 'information_schema'
      AND nspname != 'public'
  LOOP
    -- Check if the groups table exists in this schema
    IF EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = schema_name 
        AND table_name = 'groups'
    ) THEN
      -- Add group_type_id column if it doesn't exist
      EXECUTE format('
        DO $$ 
        BEGIN
          -- Add group_type_id column
          IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = %L 
              AND table_name = ''groups'' 
              AND column_name = ''group_type_id''
          ) THEN
            ALTER TABLE %I.groups 
            ADD COLUMN group_type_id INTEGER REFERENCES public.group_types(id);
            
            -- Set existing groups to "discussion" type (id=1)
            UPDATE %I.groups SET group_type_id = 1;
          END IF;
        END $$;
      ', schema_name, schema_name, schema_name);
      
      RAISE NOTICE 'Added group_type_id to groups table in schema: %', schema_name;
    END IF;
  END LOOP;
END $$;

-- Step 4: Make the column required for future groups in all schemas
DO $$
DECLARE
  schema_name text;
BEGIN
  FOR schema_name IN 
    SELECT nspname 
    FROM pg_namespace 
    WHERE nspname NOT LIKE 'pg_%' 
      AND nspname != 'information_schema'
      AND nspname != 'public'
  LOOP
    -- Check if the groups table exists in this schema
    IF EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = schema_name 
        AND table_name = 'groups'
    ) THEN
      -- Make the column NOT NULL
      EXECUTE format('
        ALTER TABLE %I.groups 
        ALTER COLUMN group_type_id SET NOT NULL;
      ', schema_name);
      
      RAISE NOTICE 'Set group_type_id to NOT NULL in schema: %', schema_name;
    END IF;
  END LOOP;
END $$;