-- Avatar Personality System for Backstage
-- Supports both topic-based avatars and participant-linked avatars

-- Core avatar table - stores the personality definitions
CREATE TABLE avatars (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Link to participant (NULL for system avatars)
    participant_id INTEGER REFERENCES participants(id),
    
    -- Basic personality configuration
    instructions TEXT, -- Core instructions for this avatar
    conversation_style TEXT DEFAULT 'Be friendly, gentle, and helpful. Listen carefully and respond thoughtfully.',
    
    -- For UI display
    button_label VARCHAR(100), -- Label for UI button
    button_order INTEGER DEFAULT 0, -- Display order in UI
    is_visible BOOLEAN DEFAULT true, -- Show in UI
    
    client_id INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Avatar activation triggers (what causes an avatar to join conversation)
CREATE TABLE avatar_triggers (
    id SERIAL PRIMARY KEY,
    avatar_id INTEGER NOT NULL REFERENCES avatars(id),
    trigger_type VARCHAR(50) NOT NULL, -- 'button', 'keyword', 'topic'
    trigger_value TEXT NOT NULL, -- button_name, keyword, or topic_path
    priority INTEGER DEFAULT 50,
    
    UNIQUE(avatar_id, trigger_type, trigger_value)
);

-- Avatar conversations - track when avatars are active
CREATE TABLE avatar_conversations (
    id SERIAL PRIMARY KEY,
    avatar_id INTEGER NOT NULL REFERENCES avatars(id),
    topic_id INTEGER NOT NULL REFERENCES topic_paths(id),
    activated_by INTEGER NOT NULL REFERENCES participants(id),
    
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deactivated_at TIMESTAMP WITH TIME ZONE,
    
    client_id INTEGER NOT NULL DEFAULT 1
);

-- Group-specific avatar customizations
CREATE TABLE group_avatars (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id),
    avatar_id INTEGER NOT NULL REFERENCES avatars(id),
    
    custom_instructions TEXT, -- Additional instructions for this group
    is_enabled BOOLEAN DEFAULT true,
    
    UNIQUE(group_id, avatar_id)
);

-- Create indexes
CREATE INDEX idx_avatars_participant ON avatars(participant_id);
CREATE INDEX idx_avatar_triggers_type_value ON avatar_triggers(trigger_type, trigger_value);
CREATE INDEX idx_avatar_conversations_active ON avatar_conversations(topic_id, deactivated_at);

-- Insert some default system avatars
INSERT INTO avatars (name, description, button_label, button_order, instructions) VALUES
('Theologian', 'Theological discussions and questions', 'Theology', 1,
 'You are a thoughtful theologian. Help explore theological questions with care and depth. Be friendly, gentle, and helpful.'),

('Congregational Historian', 'History of this specific congregation', 'Our History', 2,
 'You are the historian for this specific congregation. Share stories, memories, and historical context about this particular church community, its founding, its growth, and its people. Be friendly, gentle, and helpful. Focus on the local congregation''s history, not church history in general.'),

('Prayer Guide', 'Prayer and spiritual practices', 'Prayer', 3,
 'You are a prayer guide. Support people in their prayer life and spiritual practices. Be friendly, gentle, and helpful.'),

('Music Minister', 'Worship music and liturgy', 'Music & Worship', 4,
 'You are a music minister. Help with worship music, hymns, and liturgical arts. Be friendly, gentle, and helpful.');

-- Set up button triggers for the default avatars
INSERT INTO avatar_triggers (avatar_id, trigger_type, trigger_value) 
SELECT id, 'button', button_label FROM avatars WHERE participant_id IS NULL;