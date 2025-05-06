-- Add public_url column to grp_con_uploads table in all client schemas

-- Function to add the column to a specific schema
CREATE OR REPLACE FUNCTION add_public_url_to_schema(schema_name TEXT) RETURNS void AS $$
BEGIN
    EXECUTE format('
        ALTER TABLE %I.grp_con_uploads 
        ADD COLUMN IF NOT EXISTS public_url TEXT;
    ', schema_name);
END;
$$ LANGUAGE plpgsql;

-- Add to dev schema
SELECT add_public_url_to_schema('dev');

-- Add to conflict-club schema
SELECT add_public_url_to_schema('conflict_club');

-- Add to first-congregational schema
SELECT add_public_url_to_schema('first_congregational');

-- Add to bsa schema
SELECT add_public_url_to_schema('bsa');

-- Drop the function when done
DROP FUNCTION add_public_url_to_schema;