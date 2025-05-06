-- Create the grp_courses table
CREATE TABLE grp_courses (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Optional course-specific fields
  status VARCHAR(50) DEFAULT 'active', -- e.g., 'draft', 'active', 'archived'
  CONSTRAINT fk_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Create the grp_course_avatar_turns table
CREATE TABLE grp_course_avatar_turns (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  avatar_id INTEGER NOT NULL,
  turn_index INTEGER NOT NULL,
  content_text TEXT,
  embedding VECTOR(1536), -- For semantic search
  turn_kind VARCHAR(50) DEFAULT 'REGULAR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_course FOREIGN KEY (course_id) REFERENCES grp_courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_avatar FOREIGN KEY (avatar_id) REFERENCES avatars(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_grp_courses_group_id ON grp_courses(group_id);
CREATE INDEX idx_grp_course_avatar_turns_course_id ON grp_course_avatar_turns(course_id);
CREATE INDEX idx_grp_course_avatar_turns_avatar_id ON grp_course_avatar_turns(avatar_id);