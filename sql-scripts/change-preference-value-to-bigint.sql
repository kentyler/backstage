-- Change site_preferences.value from JSONB to BIGINT
-- This script extracts the LLM ID from the JSON object and stores it directly as a number

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

-- Note: After running this script, you'll need to update any code that expects
-- the value to be a JSON object with an llm_id property to instead expect a direct number.
-- The llmService.js file has already been updated to handle this change.