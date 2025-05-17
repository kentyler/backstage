## [2025-05-16] Decision: LLM Preference Hierarchy

**Context**: 
We needed a flexible way to manage LLM selection across different levels of the application while maintaining sensible defaults.

**Decision**:
Implement a two-level LLM preference system:
1. Schema-level LLMs (admin-configured)
   - Defined in `llms` table with schema-specific configurations
   - Schema default stored in `schema_settings.default_llm_id`
2. Topic Path LLMs (optional overrides)
   - Can be set on any topic path
   - Stored in `topic_paths.llm_id`
   - Inherits from parent path if not set

**Status**: Proposed

**Impact**:
- Database: Requires `llm_id` column in `topic_paths`
- API: New endpoints for LLM management
- UI: LLM selector in topic path editor

**Example**:
```sql
-- Schema default LLM
UPDATE schema_settings 
SET default_llm_id = (SELECT id FROM llms WHERE name = 'claude-3-opus' AND schema = current_schema)
WHERE schema = current_schema;

-- Topic path override
UPDATE topic_paths 
SET llm_id = (SELECT id FROM llms WHERE name = 'gpt-4' AND schema = current_schema)
WHERE path = 'engineering.ai_models';
```

**Related**:
- Architecture: LLM Integration
- Components: Topic Paths, LLM Service
