-- Fix topic_paths foreign key constraint
-- Drop the old foreign key constraint that references client_id
-- Add new foreign key constraint that references group_id -> groups.id

-- First, check what constraints exist
\d topic_paths;

-- Drop the old foreign key constraint
ALTER TABLE topic_paths DROP CONSTRAINT IF EXISTS fk_topic_paths_client;
ALTER TABLE topic_paths DROP CONSTRAINT IF EXISTS topic_paths_client_id_fkey;

-- Add the correct foreign key constraint for group_id
ALTER TABLE topic_paths 
ADD CONSTRAINT fk_topic_paths_group 
FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

-- Verify the new constraint
\d topic_paths;