-- Migration: Change turn_index from integer to numeric with view recreation
-- Date: 2025-06-09
-- Purpose: Allow fractional turn indexes for comments (e.g., 1.5, 2.1)

BEGIN;

-- Step 1: Store the view definition for recreation
-- (We'll recreate it manually since we know the structure)

-- Step 2: Drop the dependent view
DROP VIEW IF EXISTS participant_topic_turns_with_names;

-- Step 3: Alter the turn_index column type
ALTER TABLE participant_topic_turns 
ALTER COLUMN turn_index TYPE NUMERIC(10,2);

-- Step 4: Recreate the view with the same structure
CREATE VIEW participant_topic_turns_with_names AS
SELECT 
    t.id,
    t.topic_id,
    t.content_text,
    t.message_type_id,
    t.turn_kind_id,
    t.created_at,
    t.turn_index,
    t.llm_id,
    t.participant_id,
    p.name AS participant_name,
    l.name AS llm_name
FROM participant_topic_turns t
LEFT JOIN participants p ON t.participant_id = p.id
LEFT JOIN llms l ON t.llm_id = l.id;

COMMIT;

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'participant_topic_turns' 
AND column_name = 'turn_index';