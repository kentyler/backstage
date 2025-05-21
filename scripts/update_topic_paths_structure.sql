-- Add numeric ID column to topic_paths table

-- First, create a sequence for the IDs
CREATE SEQUENCE IF NOT EXISTS topic_paths_numeric_id_seq;

-- Rename current ID column to path_id for clarity
ALTER TABLE topic_paths RENAME COLUMN id TO path_id;

-- Add new numeric ID column as the primary key
ALTER TABLE topic_paths ADD COLUMN id BIGINT DEFAULT nextval('topic_paths_numeric_id_seq') NOT NULL;

-- Set the ID as the primary key
ALTER TABLE topic_paths DROP CONSTRAINT IF EXISTS topic_paths_pkey;
ALTER TABLE topic_paths ADD PRIMARY KEY (id);

-- Update the sequence to start after the highest ID
SELECT setval('topic_paths_numeric_id_seq', COALESCE((SELECT MAX(id) FROM topic_paths), 0) + 1);

-- Add unique constraint on path_id to maintain uniqueness
ALTER TABLE topic_paths ADD CONSTRAINT topic_paths_path_id_key UNIQUE (path_id);

-- Add index on path for faster lookups
CREATE INDEX IF NOT EXISTS idx_topic_paths_path ON topic_paths(path);
