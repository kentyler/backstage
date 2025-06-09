-- Migration: Change turn_index from integer to numeric to support decimal values for comments
-- Date: 2025-06-09
-- Purpose: Allow fractional turn indexes for comments (e.g., 1.5, 2.1)

-- Alter the turn_index column in participant_topic_turns table
ALTER TABLE participant_topic_turns 
ALTER COLUMN turn_index TYPE NUMERIC(10,2);

-- Note: This is a safe migration because:
-- 1. Existing integer values will convert cleanly to numeric (e.g., 1 → 1.00)
-- 2. No data loss will occur
-- 3. Comments can now use fractional indexes between messages