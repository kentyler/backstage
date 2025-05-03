-- Add comments feature to the database
-- 1. Change turn_index column in grp_con_avatar_turns from integer to numeric(10,2)
-- 2. Add a new turn_kind for comments

-- Change turn_index column type
-- Using numeric(10,2) to support nested comments (e.g., 22.50, 22.25, etc.)
ALTER TABLE public.grp_con_avatar_turns 
ALTER COLUMN turn_index TYPE numeric(10,2);

-- Add a new turn_kind for comments (assuming ID 1 is for regular turns)
INSERT INTO public.turn_kinds (id, name, description)
VALUES (2, 'comment', 'A comment on another turn')
ON CONFLICT (id) DO NOTHING;

-- Note: This schema change allows for nested comments
-- Example: Between turns with indices 22.00 and 21.00:
-- - A comment could be added at index 22.50
-- - Another comment on that comment could be added at index 22.25
-- - And so on, allowing for hierarchical commenting