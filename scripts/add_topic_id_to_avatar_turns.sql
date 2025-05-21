-- Add topic_id column to grp_topic_avatar_turns table

-- Create a temporary translation table from topic_paths
CREATE TEMPORARY TABLE topic_translation AS
SELECT index AS old_id, id AS new_id FROM topic_paths;

-- Add the topic_id column (bigint)
ALTER TABLE grp_topic_avatar_turns ADD COLUMN topic_id BIGINT;

-- Update the new topic_id based on the existing topicpathid values
UPDATE grp_topic_avatar_turns
SET topic_id = tt.new_id
FROM topic_translation tt
WHERE grp_topic_avatar_turns.topicpathid = tt.old_id;

-- Create an index on the new column for better performance
CREATE INDEX idx_grp_topic_avatar_turns_topic_id ON grp_topic_avatar_turns(topic_id);

-- Add a foreign key constraint (optional)
ALTER TABLE grp_topic_avatar_turns 
  ADD CONSTRAINT fk_grp_topic_avatar_turns_topic
  FOREIGN KEY (topic_id) REFERENCES topic_paths(id);

-- Drop the temporary translation table
DROP TABLE topic_translation;
