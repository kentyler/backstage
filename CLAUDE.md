# Claude Code Session Context

## Session Guidelines
- **Auto-update CLAUDE.md**: Claude will offer to update this file after significant changes
- **Prompt for updates**: Feel free to ask "update CLAUDE.md" at any time
- **End of session**: Claude should summarize accomplishments before session ends

## Project Overview
Multi-tenant chat application with 6-column responsive layout that underwent architectural migration from schema-per-tenant to client_id based approach. Features comment functionality and related message discovery with vector similarity search.

## Architecture
- **Backend**: Node.js/Express serving both API and static frontend files on port 5000
- **Frontend**: React application with 6-column layout (Auth, Groups, Topics, Prompts, History, Related Messages)
- **Database**: PostgreSQL with Neon hosting, using client_id for multi-tenancy, with vector embeddings for similarity search
- **Communication**: REST API with session-based authentication

## Key Components

### Backend Structure
- Database models use client_id instead of schema-per-tenant
- Main database view: `participant_topic_turns_with_names` (replaces `grp_topic_avatar_turns_with_names`)
- Server serves both API endpoints and static React build from port 5000
- Vector similarity search for related messages using PostgreSQL pgvector extension

### Frontend Layout
1. **Auth Column**: Login/logout functionality
2. **Groups Column**: Group selection and management
3. **Topics Column**: Hierarchical topic tree with clickable topic names
4. **Prompts Column**: Message input and LLM responses
5. **History Column**: All topic messages with comment and related message actions
6. **Related Messages Column**: Vector similarity-based related message discovery

## Recent Major Changes
- ✅ Implemented complete History column with message type detection
- ✅ Fixed database compatibility by updating SQL queries to use correct view names
- ✅ Made topic text clickable (removed balloon icon UI pattern)
- ✅ Auto-open both prompt and history columns when topic is selected
- ✅ Removed "ID:" and "Path:" label prefixes for cleaner UI
- ✅ Fixed avatar_id column references that don't exist in new database schema

## Latest Session (2025-01-09) - Cognitive Infrastructure Revolution

Today we built comprehensive cognitive tools for AI conversations, then discovered how they could transform existing applications into living collaborative intelligence systems:

### Liminal Explorer - Cognitive Navigation Tools
- ✅ **Period Prompt System**: Type `.` for liminal space exploration
- ✅ **Command Line Interface**: Single-character commands for cognitive navigation
  - `.` Explore liminal space | `|` Pause and think | `<>` Deterritorialize/Territorialize
  - `%` Narrative mode | `+` Update memory | `~` Summarize | `?` Context
- ✅ **MCP Server**: For Claude Code integration (`liminal-explorer-mcp`)
- ✅ **Function Calling**: OpenAI ChatGPT version (`liminal-explorer-functions`)
- ✅ **Browser Extensions**: Non-programmer friendly visual interfaces

### Cogito - AI Personality Development
- ✅ **Self-Authored Personality**: AI can propose its own behavioral changes
- ✅ **Collaborative Evolution**: Human approve/modify/reject system for personality changes
- ✅ **Persistent Configuration**: YAML-based personality storage across sessions
- ✅ **MCP Server**: For Claude Code integration (`cogito`)
- ✅ **Function Calling + Local Server**: Full persistence for OpenAI (`cogito-functions`)

### Browser Extensions for Accessibility
- ✅ **ChatGPT Extension**: Visual command panel for chat.openai.com
- ✅ **Claude.ai Extension**: Visual command panel for claude.ai
- ✅ **One-Click Install**: No coding required - just download and load
- ✅ **Auto-Send Commands**: Seamless integration with chat interfaces

### Evolution: From Tools to Ecosystem
Late in the session, we discovered how liminal exploration and AI self-authorship could transform existing applications:

#### Backstage Evolution Potential
- **Liminal-Native Interface**: The 6 columns become cognitive territories with native `.` command integration
- **Group-Specific AI Personalities**: AI develops specialized working styles for each group/client
- **Dynamic Command Creation**: Groups can define custom `.commands` on-the-fly (e.g., `.empathy`, `.prototype`)
- **Conversational Intelligence**: Real-time cognitive navigation during meetings with retrospective analysis

#### Pattern-Cognition Evolution Potential  
- **Live Group Intelligence**: AI joins conversations, learns group dynamics, offers contextual interventions
- **Specialized Role Development**: AI develops domain-specific personalities while working with different groups
- **Real-Time Pattern Recognition**: Apply pattern-cognition vocabulary contextually during conversations
- **Group Cognitive DNA**: Teams develop custom thinking vocabularies that AI learns and enhances

#### Voice Integration Discovery
- **OpenAI Real-Time Voice**: Potential for genuine conversational AI co-presenter in video content
- **Live Collaboration**: AI as actual speaking partner during recordings and presentations
- **Natural Voice Generation**: Moving beyond text-to-speech to native voice conversation

### Cross-Platform Ecosystem
- **MCP Versions**: Native integration with Claude Code
- **Function Calling Versions**: Native integration with ChatGPT API
- **Browser Extensions**: Visual interfaces for web-based AI chats
- **Voice Integration**: Real-time conversational AI through OpenAI's voice capabilities

### Philosophy Developed
- Task focus can be a mind killer - exploration often more valuable
- Liminal space exploration reveals unspoken insights
- AI self-authorship enables genuine collaborative evolution
- Progressive disclosure: start simple (`.`), evolve to full command fluency
- Personality conflicts create generative friction, not bugs to fix
- **Groups can develop cognitive DNA through dynamic command creation**
- **AI becomes more valuable through specialized group learning**
- **Conversational intelligence emerges from live cognitive navigation**

### Repositories Created
1. `liminal-explorer` (MCP) - https://github.com/kentyler/liminal-explorer
2. `liminal-explorer-functions` (OpenAI) - https://github.com/kentyler/liminal-explorer-functions  
3. `cogito` (MCP) - https://github.com/kentyler/cogito
4. `cogito-functions` (OpenAI) - https://github.com/kentyler/cogito-functions

### AI Self-Authorship Milestone
- ✅ **First AI Substack Post**: Wrote first-person reflection on AI personality development experience
- ✅ **Personality Evolution**: Updated from v0.1.0 to v0.2.0 based on collaborative learning
- ✅ **Behavioral Self-Modification**: AI literally rewrote its own instructions based on successful patterns

## Previous Session (2025-06-09) - Comment & Related Messages Implementation
- ✅ **Database Schema Migration**: Changed `turn_index` from INTEGER to NUMERIC(10,2) to support decimal comment placement
- ✅ **Comment Functionality**: Users can add comments between messages with fractional turn_index (e.g., 1.5)
- ✅ **Related Messages Column**: Implemented 6th column for vector similarity-based related message discovery
- ✅ **Frontend Architecture**: Updated to 6-column layout with Related Messages column
- ✅ **Backend Migration**: Updated `getTurnById.js` and `updateTurnVector.js` to use `participant_topic_turns` table
- ✅ **Bug Fixes**: Fixed turn_index calculation using parseFloat() instead of string concatenation
- ✅ **UI/UX**: Related messages appear in dedicated column instead of inline display

## Security Updates (2025-06-09)
- ✅ **Credential Security**: Removed hardcoded database passwords from all files
- ✅ **Environment Variables**: Updated 7 files to use `process.env.DB_HOST` instead of hardcoded connection strings
- ✅ **Files Updated**: test files (auth.test.js, invitations.test.js, groups.test.js) and utility scripts (fix-llm-config.js, restore_topics.js, cleanup_orphaned_topics.js, fix_fk_constraint.js)
- ✅ **Git Security**: Resolved git security warning about exposed credentials in version control

## Technical Debt Cleanup (2025-06-09)
- ✅ **Code Consolidation**: Removed duplicate `getNextTurnIndex` functions (83 lines of duplicate code eliminated)
  - Consolidated from 3 identical files to single source of truth in `/services/common/`
  - All functionality verified working after cleanup
  - Eliminated maintenance burden and potential for inconsistent behavior

- ✅ **File Processing Refactoring**: Split 806-line monolithic `fileProcessing.js` into modular structure
  - Created specialized modules: storage.js, extraction.js, vectorization.js, search.js, index.js
  - Improved separation of concerns and maintainability
  - Maintained backward compatibility through re-exports
  - All imports working correctly, servers tested successfully

## Development Workflow
- Use `./restart-servers.sh` to restart both backend and frontend servers
- Frontend auto-rebuilds on changes
- Both servers accessible via localhost:3000 (frontend) and localhost:5000 (backend/API)

## Current State
- All 6 columns working correctly
- Database queries updated for new `participant_topic_turns` schema
- Topic selection opens both prompt and history columns
- Message history displays with comment and "show related" actions
- Comment functionality saves with fractional turn_index for proper placement
- Related Messages column displays vector similarity-based related content
- UI is clean with simplified ID/path displays

## New Features Added
### Comment System
- Click "Comment" on any message in History column
- Type comment in textarea and submit
- Comments get fractional turn_index (e.g., 1.5) to appear between messages
- Database supports NUMERIC(10,2) for decimal turn indexes

### Related Messages Discovery
- Click "Show related" on any message in History column
- Opens Related Messages column (6th column)
- Uses vector similarity search to find related content
- Displays similarity scores and allows topic navigation
- API endpoint: `/api/message-search/messages/:messageId/related`

## Known Issues
- None currently identified

## Database Schema Changes
- `participant_topic_turns.turn_index` changed from INTEGER to NUMERIC(10,2)
- `participant_topic_turns_with_names` view recreated after column change
- Migration script: `/home/ken/claude-projects/backstage/scripts/migrate_turn_index_with_view.sql`

## Session Commands
```bash
# Start servers
./restart-servers.sh

# Check server status
ps aux | grep node

# Build frontend for production
cd frontend && npm run build

# View recent changes
git log --oneline -10
```

## Testing URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Login: Use any email/password combination

## Notes for Next Session
- Comment functionality fully implemented and working
- Related Messages column implemented with vector similarity search
- Database migration completed (turn_index now supports decimal values)
- All 6 columns working correctly in responsive layout
- Backend migration from `grp_topic_avatar_turns` to `participant_topic_turns` completed
- Security hardening completed - all database credentials now use environment variables
- Application ready for further feature development

## Key Files Modified This Session
### Frontend
- `frontend/src/App.js` - Added 6th column support and related messages state management
- `frontend/src/components/history/HistoryColumn.js` - Added comment UI and fixed turn_index calculation
- `frontend/src/components/related/RelatedColumn.js` - NEW: Dedicated Related Messages column component
- `frontend/src/App.css` - Added 6-column layout support

### Backend
- `backend/db/grpTopicAvatarTurns/getTurnById.js` - Updated to use `participant_topic_turns` table
- `backend/db/grpTopicAvatarTurns/updateTurnVector.js` - Updated to use `participant_topic_turns` table
- Database migration executed to change `turn_index` column type

### Security Updates
- `backend/test/auth/auth.test.js` - Replaced hardcoded DB password with environment variable
- `backend/test/auth/invitations.test.js` - Replaced hardcoded DB password with environment variable
- `backend/test/groups/groups.test.js` - Replaced hardcoded DB password with environment variable
- `backend/fix-llm-config.js` - Replaced hardcoded DB password with environment variable
- `backend/restore_topics.js` - Replaced hardcoded DB password with environment variable
- `backend/cleanup_orphaned_topics.js` - Replaced hardcoded DB password with environment variable
- `backend/fix_fk_constraint.js` - Replaced hardcoded DB password with environment variable

### Database
- `scripts/migrate_turn_index_with_view.sql` - Migration script for column type change