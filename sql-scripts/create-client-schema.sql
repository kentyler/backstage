-- SQL script to create a client schema and duplicate tables from dev schema
-- Replace 'client1' with the actual client name when using this script
-- This script uses the dev schema as the source for table structures, which contains the latest tested changes

-- Create schema for the client
CREATE SCHEMA IF NOT EXISTS client1;

-- Duplicate tables from dev schema to client schema
DO $$
DECLARE
    table_exists boolean;
BEGIN
    -- Participants table
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'dev' AND table_name = 'participants') INTO table_exists;
    IF table_exists THEN
        CREATE TABLE client1.participants (LIKE dev.participants INCLUDING ALL);
        RAISE NOTICE 'Created participants table';
    END IF;

    -- Groups table
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'dev' AND table_name = 'groups') INTO table_exists;
    IF table_exists THEN
        CREATE TABLE client1.groups (LIKE dev.groups INCLUDING ALL);
        RAISE NOTICE 'Created groups table';
    END IF;

    -- Group conversations (grpCons) table
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'dev' AND table_name = 'grp_cons') INTO table_exists;
    IF table_exists THEN
        CREATE TABLE client1.grp_cons (LIKE dev.grp_cons INCLUDING ALL);
        RAISE NOTICE 'Created grp_cons table';
    END IF;

    -- Group conversation avatars (grpConAvatars) table
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'dev' AND table_name = 'grp_con_avatars') INTO table_exists;
    IF table_exists THEN
        CREATE TABLE client1.grp_con_avatars (LIKE dev.grp_con_avatars INCLUDING ALL);
        RAISE NOTICE 'Created grp_con_avatars table';
    END IF;

    -- Group conversation avatar turns (grpConAvatarTurns) table
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'dev' AND table_name = 'grp_con_avatar_turns') INTO table_exists;
    IF table_exists THEN
        CREATE TABLE client1.grp_con_avatar_turns (LIKE dev.grp_con_avatar_turns INCLUDING ALL);
        RAISE NOTICE 'Created grp_con_avatar_turns table';
    END IF;

    -- Group conversation avatar turn relationships (grpConAvatarTurnRelationships) table
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'dev' AND table_name = 'grp_con_avatar_turn_relationships') INTO table_exists;
    IF table_exists THEN
        CREATE TABLE client1.grp_con_avatar_turn_relationships (LIKE dev.grp_con_avatar_turn_relationships INCLUDING ALL);
        RAISE NOTICE 'Created grp_con_avatar_turn_relationships table';
    END IF;

    -- Participant avatars table
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'dev' AND table_name = 'participant_avatars') INTO table_exists;
    IF table_exists THEN
        CREATE TABLE client1.participant_avatars (LIKE dev.participant_avatars INCLUDING ALL);
        RAISE NOTICE 'Created participant_avatars table';
    END IF;

    -- Participant events table
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'dev' AND table_name = 'participant_events') INTO table_exists;
    IF table_exists THEN
        CREATE TABLE client1.participant_events (LIKE dev.participant_events INCLUDING ALL);
        RAISE NOTICE 'Created participant_events table';
    END IF;

    -- Preferences tables
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'dev' AND table_name = 'preference_types') INTO table_exists;
    IF table_exists THEN
        CREATE TABLE client1.preference_types (LIKE dev.preference_types INCLUDING ALL);
        RAISE NOTICE 'Created preference_types table';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'dev' AND table_name = 'participant_preferences') INTO table_exists;
    IF table_exists THEN
        CREATE TABLE client1.participant_preferences (LIKE dev.participant_preferences INCLUDING ALL);
        RAISE NOTICE 'Created participant_preferences table';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'dev' AND table_name = 'group_preferences') INTO table_exists;
    IF table_exists THEN
        CREATE TABLE client1.group_preferences (LIKE dev.group_preferences INCLUDING ALL);
        RAISE NOTICE 'Created group_preferences table';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'dev' AND table_name = 'site_preferences') INTO table_exists;
    IF table_exists THEN
        CREATE TABLE client1.site_preferences (LIKE dev.site_preferences INCLUDING ALL);
        RAISE NOTICE 'Created site_preferences table';
    END IF;

    -- Comments table
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'dev' AND table_name = 'comments') INTO table_exists;
    IF table_exists THEN
        CREATE TABLE client1.comments (LIKE dev.comments INCLUDING ALL);
        RAISE NOTICE 'Created comments table';
    END IF;
END
$$;

-- Create and set up sequences for tables with id columns
DO $$
DECLARE
    tbl_name text;
    seq_name text;
    max_id bigint;
    table_exists boolean;
BEGIN
    -- Process each table that might have an id column
    FOR tbl_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'client1'
        AND table_type = 'BASE TABLE'
    LOOP
        -- Check if the table has an id column
        PERFORM 1
        FROM information_schema.columns
        WHERE table_schema = 'client1'
        AND table_name = tbl_name
        AND column_name = 'id';
        
        IF FOUND THEN
            -- Construct the sequence name (standard PostgreSQL naming convention)
            seq_name := tbl_name || '_id_seq';
            
            -- Create the sequence
            EXECUTE format('CREATE SEQUENCE IF NOT EXISTS client1.%I', seq_name);
            
            -- Set the sequence as the default for the id column
            EXECUTE format('ALTER TABLE client1.%I ALTER COLUMN id SET DEFAULT nextval(''client1.%I'')', 
                          tbl_name, seq_name);
            
            -- Set the sequence ownership
            EXECUTE format('ALTER SEQUENCE client1.%I OWNED BY client1.%I.id', 
                          seq_name, tbl_name);
            
            -- Check if the corresponding table exists in dev schema
            EXECUTE format('SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = ''dev'' AND table_name = ''%I'')', tbl_name) INTO table_exists;
            
            IF table_exists THEN
                -- Get the maximum id value from the dev table
                EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM dev.%I', tbl_name) INTO max_id;
                
                -- Set the sequence to start from the next value after the maximum id
                IF max_id > 0 THEN
                    EXECUTE format('SELECT setval(''client1.%I'', %s, true)', 
                                  seq_name, max_id);
                    RAISE NOTICE 'Set sequence % to start from % for table %', seq_name, max_id + 1, tbl_name;
                END IF;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Sequence setup complete for schema: client1';
END $$;

-- Grant permissions to roles as needed
-- GRANT USAGE ON SCHEMA client1 TO app_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA client1 TO app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA client1 TO app_user;

-- Final verification of sequences
DO $$
DECLARE
    tbl_name text;
    seq_name text;
    default_value text;
    seq_exists boolean;
BEGIN
    RAISE NOTICE 'Verifying sequences for schema: client1';
    
    FOR tbl_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'client1'
        AND table_type = 'BASE TABLE'
    LOOP
        -- Check if the table has an id column
        PERFORM 1
        FROM information_schema.columns
        WHERE table_schema = 'client1'
        AND table_name = tbl_name
        AND column_name = 'id';
        
        IF FOUND THEN
            -- Construct the sequence name
            seq_name := tbl_name || '_id_seq';
            
            -- Check if the sequence exists
            EXECUTE format('SELECT EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_schema = ''client1'' AND sequence_name = ''%I'')', seq_name) INTO seq_exists;
            
            IF NOT seq_exists THEN
                RAISE WARNING 'Sequence % does not exist for table %', seq_name, tbl_name;
            ELSE
                -- Check if the sequence is set as the default for the id column
                EXECUTE format('SELECT column_default FROM information_schema.columns WHERE table_schema = ''client1'' AND table_name = ''%I'' AND column_name = ''id''', tbl_name) INTO default_value;
                
                IF default_value IS NULL OR default_value NOT LIKE '%' || seq_name || '%' THEN
                    RAISE WARNING 'Sequence % is not set as the default for id column in table %', seq_name, tbl_name;
                ELSE
                    RAISE NOTICE 'Sequence % is properly set up for table %', seq_name, tbl_name;
                END IF;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Sequence verification complete for schema: client1';
END $$;