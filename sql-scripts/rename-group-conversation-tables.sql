-- Rename tables from group_conversation_* to grp_con_*

-- 1. Rename group_conversation_avatars table
ALTER TABLE IF EXISTS public.group_conversation_avatars 
  RENAME TO grp_con_avatars;

-- 2. Rename group_conversation_avatar_turns table
ALTER TABLE IF EXISTS public.group_conversation_avatar_turns 
  RENAME TO grp_con_avatar_turns;

-- 3. Rename group_conversation_avatar_turn_relationships table
ALTER TABLE IF EXISTS public.group_conversation_avatar_turn_relationships 
  RENAME TO grp_con_avatar_turn_relationships;

-- 4. Rename group_conversation_avatar_events table
ALTER TABLE IF EXISTS public.group_conversation_avatar_events 
  RENAME TO grp_con_avatar_events;

-- 5. Rename group_conversations table (if it exists)
ALTER TABLE IF EXISTS public.group_conversations 
  RENAME TO grp_con_conversations;

-- Update sequence names if they don't automatically update
-- Note: In PostgreSQL, sequences are typically named as tablename_columnname_seq
-- and are automatically renamed when the table is renamed if they follow this convention

-- If you have any sequences that don't follow the convention, you would rename them like this:
-- ALTER SEQUENCE public.group_conversation_avatars_id_seq RENAME TO grp_con_avatars_id_seq;

-- Update foreign key constraint names if needed
-- Note: In PostgreSQL, constraints are typically named as tablename_columnname_fkey
-- and are automatically renamed when the table is renamed if they follow this convention

-- If you have any constraints that don't follow the convention, you would rename them like this:
-- ALTER TABLE public.some_table RENAME CONSTRAINT fk_group_conversation_avatars TO fk_grp_con_avatars;

-- Update index names if needed
-- Note: In PostgreSQL, indexes are typically named as tablename_columnname_idx
-- and are automatically renamed when the table is renamed if they follow this convention

-- If you have any indexes that don't follow the convention, you would rename them like this:
-- ALTER INDEX public.idx_group_conversation_avatars_avatar_id RENAME TO idx_grp_con_avatars_avatar_id;