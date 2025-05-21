-- Migration script to remove the unique constraint from participant_preferences table
-- This allows for creating a history of topic preferences instead of just storing the current preference

-- Drop the unique constraint
ALTER TABLE participant_preferences
DROP CONSTRAINT participant_preferences_participant_id_preference_type_id_key;

-- Add a comment explaining the change
COMMENT ON TABLE participant_preferences IS 'Stores participant preferences, including historical records for analysis';
