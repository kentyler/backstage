# LLM Management Design Document

## Overview
This document outlines the design for managing LLM (Large Language Model) selection and usage within the application, focusing on a topic-centric approach.

## Core Concepts

### 1. Topic-Centric Model
- Entries are organized by topic paths (e.g., 'projects/llm/design')
- Each topic path can have multiple entries over time
- Entries within a topic share contextual relationship

### 2. LLM Selection Hierarchy
1. Topic-specific LLM preference (if set)
2. Schema default LLM
3. Global default LLM (fallback)

## Database Schema

### 1. Topic LLM Preferences
```sql
CREATE TABLE topic_llm_preferences (
    topic_path LTREE PRIMARY KEY,
    llm_id INTEGER NOT NULL,
    created_by INTEGER REFERENCES participants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient path queries
CREATE INDEX idx_topic_llm_path ON topic_llm_preferences USING GIST (topic_path);
```

### 2. LLM Usage Logging
```sql
CREATE TABLE llm_usage_logs (
    id SERIAL PRIMARY KEY,
    llm_id INTEGER NOT NULL,
    topic_path LTREE NOT NULL,
    is_schema_default BOOLEAN NOT NULL,
    is_topic_override BOOLEAN NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES participants(id)
);

-- Index for analytics
CREATE INDEX idx_llm_usage_topic ON llm_usage_logs USING GIST (topic_path);
CREATE INDEX idx_llm_usage_llm ON llm_usage_logs (llm_id);
CREATE INDEX idx_llm_usage_created ON llm_usage_logs (created_at);
```

## API Endpoints

### 1. Get LLM for Topic
```
GET /api/llm/for-topic?topicPath=projects/llm/design
```
Response:
```json
{
  "llm": {
    "id": "claude-3-opus",
    "name": "Claude 3 Opus",
    "isSchemaDefault": false,
    "isTopicOverride": true
  },
  "availableLLMs": [
    {"id": "claude-3-opus", "name": "Claude 3 Opus"},
    {"id": "gpt-4", "name": "GPT-4"}
  ]
}
```

### 2. Set Topic LLM Preference
```
POST /api/llm/topic-preference
{
  "topicPath": "projects/llm/design",
  "llmId": "gpt-4"
}
```

### 3. Reset to Schema Default
```
DELETE /api/llm/topic-preference?topicPath=projects/llm/design
```

## Frontend Components

### 1. LLM Selector
- Displays current LLM selection
- Dropdown of available LLMs
- Visual indicators:
  - 🔒 Default (schema)
  - 📌 Topic-specific
  - ⚡ Session-only

### 2. Usage Statistics
- Tokens used per topic
- Cost analysis
- Performance metrics

## Open Questions
1. Should we implement rate limiting per LLM?
2. Do we need model versioning in the preferences?
3. How to handle deprecated/removed models?

## Next Steps
1. Implement database migrations
2. Create API endpoints
3. Build frontend components
4. Add analytics dashboard
