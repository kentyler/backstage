-- Change preference tables from JSONB to BIGINT
-- This script extracts values from JSON objects and stores them directly as numbers

-- Part 1: Change site_preferences.value from JSONB to BIGINT
-- Step 1: Add a temporary column to store the extracted LLM ID
ALTER TABLE site_preferences ADD COLUMN value_temp BIGINT;

-- Step 2: Update the temporary column with the LLM ID extracted from the JSON
-- For records where value is a JSON object with llm_id property
UPDATE site_preferences SET value_temp = (value->>'llm_id')::BIGINT WHERE value ? 'llm_id';
-- For records where value is already a number (in case some records have been migrated)
UPDATE site_preferences SET value_temp = value::BIGINT WHERE jsonb_typeof(value) = 'number';

-- Step 3: Drop the original column
ALTER TABLE site_preferences DROP COLUMN value;

-- Step 4: Rename the temporary column to the original column name
ALTER TABLE site_preferences RENAME COLUMN value_temp TO value;

-- Part 2: Change preference_types.default_value from JSONB to BIGINT
-- Step 1: Add a temporary column to store the extracted value
ALTER TABLE preference_types ADD COLUMN default_value_temp BIGINT;

-- Step 2: Update the temporary column with the value extracted from the JSON
-- For records where default_value is a JSON object with llm_id property
UPDATE preference_types SET default_value_temp = (default_value->>'llm_id')::BIGINT WHERE default_value ? 'llm_id';
-- For records where default_value is already a number
UPDATE preference_types SET default_value_temp = default_value::BIGINT WHERE jsonb_typeof(default_value) = 'number';

-- Step 3: Drop the original column
ALTER TABLE preference_types DROP COLUMN default_value;

-- Step 4: Rename the temporary column to the original column name
ALTER TABLE preference_types RENAME COLUMN default_value_temp TO default_value;

-- Part 3: Change participant_preferences.value from JSONB to BIGINT
-- Step 1: Add a temporary column to store the extracted value
ALTER TABLE participant_preferences ADD COLUMN value_temp BIGINT;

-- Step 2: Update the temporary column with the value extracted from the JSON
-- For records where value is a JSON object with llm_id property
UPDATE participant_preferences SET value_temp = (value->>'llm_id')::BIGINT WHERE value ? 'llm_id';
-- For records where value is already a number
UPDATE participant_preferences SET value_temp = value::BIGINT WHERE jsonb_typeof(value) = 'number';

-- Step 3: Drop the original column
ALTER TABLE participant_preferences DROP COLUMN value;

-- Step 4: Rename the temporary column to the original column name
ALTER TABLE participant_preferences RENAME COLUMN value_temp TO value;

-- Part 4: Change group_preferences.value from JSONB to BIGINT
-- Step 1: Add a temporary column to store the extracted value
ALTER TABLE group_preferences ADD COLUMN value_temp BIGINT;

-- Step 2: Update the temporary column with the value extracted from the JSON
-- For records where value is a JSON object with llm_id property
UPDATE group_preferences SET value_temp = (value->>'llm_id')::BIGINT WHERE value ? 'llm_id';
-- For records where value is already a number
UPDATE group_preferences SET value_temp = value::BIGINT WHERE jsonb_typeof(value) = 'number';

-- Step 3: Drop the original column
ALTER TABLE group_preferences DROP COLUMN value;

-- Step 4: Rename the temporary column to the original column name
ALTER TABLE group_preferences RENAME COLUMN value_temp TO value;

-- Note: After running this script, you'll need to update any code that expects
-- the values to be JSON objects with properties to instead expect direct numbers.
-- The llmService.js file has already been updated to handle this change.