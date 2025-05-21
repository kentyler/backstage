-- Migration script to remove unique constraint on participant_preferences
-- This allows recording topic history by creating multiple records for the same participant and preference type

-- Identify the constraint name (we need to know it to drop it)
SELECT conname
FROM pg_constraint 
WHERE conrelid = 'participant_preferences'::regclass 
  AND contype = 'u' 
  AND conname LIKE '%participant_id%preference_type_id%';

-- Drop the unique constraint
ALTER TABLE participant_preferences
DROP CONSTRAINT participant_preferences_participant_id_preference_type_id_key;

-- Verify the constraint is gone
SELECT conname
FROM pg_constraint 
WHERE conrelid = 'participant_preferences'::regclass 
  AND contype = 'u' 
  AND conname LIKE '%participant_id%preference_type_id%';
