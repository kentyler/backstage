-- Create the grp_con_types lookup table
CREATE TABLE grp_con_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert the initial types
INSERT INTO grp_con_types (name, description) 
VALUES 
  ('conversation', 'Standard conversation between participants and LLMs'),
  ('course', 'Structured learning course with predefined content');

-- Add type_id field to grp_cons table
ALTER TABLE grp_cons
ADD COLUMN type_id INTEGER;

-- Create a foreign key constraint
ALTER TABLE grp_cons
ADD CONSTRAINT fk_grp_con_type
FOREIGN KEY (type_id) REFERENCES grp_con_types(id);

-- Set all existing records to have the 'conversation' type
UPDATE grp_cons
SET type_id = (SELECT id FROM grp_con_types WHERE name = 'conversation')
WHERE type_id IS NULL;

-- Make the type_id field NOT NULL after updating existing records
ALTER TABLE grp_cons
ALTER COLUMN type_id SET NOT NULL;

-- Create an index for performance when filtering by type
CREATE INDEX idx_grp_cons_type_id ON grp_cons(type_id);

-- Add a comment to the column for documentation
COMMENT ON COLUMN grp_cons.type_id IS 'Reference to grp_con_types table defining the type of group conversation';