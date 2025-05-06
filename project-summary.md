# Back-Stage Project Summary

This document provides a high-level overview of the Back-Stage project, its structure, and key components. It can be used as a quick reference for future development sessions.

## Project Overview

Back-Stage is a backend service for a group conversation or chat application. It provides APIs for managing participants (users), groups, conversations, avatars, and turns within conversations. The system supports authentication, participant events logging, complex relationships between entities, and multi-tenant operation.

The project follows a well-structured layered architecture with clear separation of concerns:

1. **Database Layer** (`src/db/`): Handles all database operations, organized by entity
2. **API Layer** (`src/routes/`): Defines RESTful endpoints and request handling
3. **Service Layer** (`src/services/`): Implements business logic and external integrations
4. **Controller Layer** (`src/controllers/`): Manages request processing for complex operations
5. **Middleware Layer** (`src/middleware/`): Provides cross-cutting concerns like authentication and schema selection

This architecture demonstrates good software engineering practices:
- **Modularity**: Each component has a single responsibility
- **Encapsulation**: Implementation details are hidden behind clear interfaces
- **Testability**: Components can be tested in isolation
- **Maintainability**: Changes to one layer don't necessarily affect others
- **Multi-tenancy**: Strong data isolation between clients with shared structure

The architecture has evolved positively under the pressure of adding new features, with recent changes including:

1. **Multi-tenancy**: Schema-based isolation for different clients with shared lookup tables
2. **Renaming Convention**: The shift from "groupConversation" to "grpCon" improves consistency and reduces verbosity
3. **LLM Integration**: Addition of language model capabilities for AI-powered conversations
4. **Participant Events**: Enhanced tracking for security and audit purposes
5. **Vector Embeddings**: Support for semantic understanding of conversation content
6. **Preference System**: Hierarchical preferences at participant, group, and site levels
7. **Comments Feature**: Support for comments on conversation turns using decimal indices

## Tech Stack

- **Runtime**: Node.js with ES Modules
- **Web Framework**: Express.js
- **Database**: PostgreSQL with vector extension for embeddings
- **Query Builder**: Knex.js
- **Authentication**: JWT (jsonwebtoken) with HTTP-only cookies
- **Password Hashing**: bcryptjs (via pgcrypto extension)
- **Testing**: Vitest
- **LLM Integration**: Support for various LLM providers (Anthropic, OpenAI) via unified API
- **Vector Embeddings**: Support for semantic search and understanding

## Project Structure

- **app.js**: Main Express application setup and route configuration
- **server.js**: Entry point that starts the HTTP server
- **src/config/**: Configuration settings (e.g., schema selection)
- **src/controllers/**: Request handlers for specific operations
- **src/db/**: Database operations organized by entity
- **src/middleware/**: Express middleware (authentication, CSRF protection, schema selection)
- **src/routes/**: API route definitions
- **src/services/**: Shared services (authentication, LLM, embeddings)
- **src/utils/**: Utility functions (e.g., client schema determination)
- **public/**: Static files for the frontend (login, conversation test pages)
- **scripts/**: Utility scripts for database operations and maintenance
- **sql-scripts/**: SQL scripts for database schema changes
- **test/**: Test files for various components

## Database Schema

The database uses schema-based multi-tenancy with the following schemas:

- **public**: Contains shared lookup tables and configuration
- **dev**: Development environment with full data set
- **client schemas** (e.g., bsa, conflict_club, first_congregational): Client-specific data with strong isolation

### Public Schema (Shared Tables)

1. **group_types**: Types of groups
   - id, name, description, created_at

2. **llm_types**: Types of language models
   - id, name, description, api_handler, created_at, updated_at

3. **llms**: Configuration for language model providers
   - id, name, provider, model, api_key, temperature, max_tokens, type_id, additional_config, subdomain, created_at, updated_at

4. **turn_kinds**: Types of turns (regular, comment)
   - id, name, description

5. **turn_relationship_types**: Types of relationships between turns
   - id, name, description

6. **preference_types**: Types of preferences
   - id, name, description, created_at, updated_at

7. **participant_event_types**: Types of participant events
   - id, name, description

8. **avatar_event_types**: Types of avatar events
   - id, name, description

9. **file_types**: Types of files
   - id, name, description

### Client Schemas (Per-Client Tables)

Each client schema contains the following tables:

1. **participants**: Users of the system
   - id, name, email, password, created_at

2. **groups**: Groups that participants can join
   - id, name, description, created_at, group_type_id

3. **participant_groups**: Junction table for many-to-many relationship between participants and groups
   - participant_id, group_id, role, created_at

4. **grp_cons** (group conversations): Conversations within groups
   - id, group_id, name, description, created_at

5. **grp_con_avatars**: Junction table for many-to-many relationship between conversations and avatars
   - grp_con_id, avatar_id, added_at

6. **grp_con_avatar_turns**: Turns (messages/interactions) within a conversation
   - id, grp_con_id, avatar_id, turn_index, content_text, content_vector, created_at, turn_kind_id

7. **grp_con_avatar_turn_relationships**: Relationships between turns
   - id, turn_id, target_turn_id, created_at, turn_relationship_type_id

8. **avatars**: AI personas with configurable behaviors
   - id, name, instruction_set, created_at, avatar_scope_id, llm_config

9. **avatar_scopes**: Scopes for avatars (e.g., public, private)
   - id, name, description

10. **participant_avatars**: Junction table for many-to-many relationship between participants and avatars
    - id, participant_id, avatar_id, created_at, created_by_participant_id

11. **participant_events**: Events related to participants (e.g., login, logout)
    - id, participant_id, event_type_id, details, created_at

12. **participant_preferences**: Preferences for participants
    - id, participant_id, preference_type_id, value, created_at, updated_at

13. **group_preferences**: Preferences for groups
    - id, group_id, preference_type_id, value, created_at, updated_at

14. **site_preferences**: Site-wide preferences
    - id, preference_type_id, value, created_at, updated_at

15. **grp_con_uploads**: File uploads associated with conversations
    - id, grp_con_id, turn_id, filename, mime_type, file_path, uploaded_at

16. **grp_con_upload_vectors**: Vector embeddings for uploaded file chunks
    - id, upload_id, chunk_index, content_text, content_vector, created_at

The schema demonstrates thoughtful entity-relationship modeling with appropriate use of junction tables for many-to-many relationships, proper normalization, and effective multi-tenant isolation.

## API Routes

The application exposes the following API endpoints:

- **/api/participants**: Participant management (CRUD)
- **/api/participants/login**: Authentication endpoint
- **/api/participants/logout**: Logout endpoint
- **/api/groups**: Group management (CRUD)
- **/api/grp-cons**: Group conversation management
- **/api/grp-con-avatars**: Avatar associations with conversations
- **/api/avatar-turns**: Turns within conversations
- **/api/avatar-turns/comment**: Comment creation on turns
- **/api/avatar-turn-relationships**: Relationships between turns
- **/api/participant-avatars**: Avatar associations with participants
- **/api/participant-events**: Participant event logging
- **/api/me**: Authenticated user information
- **/api/conversations**: Conversation management with LLM integration
- **/api/preferences/types**: Preference type management
- **/api/preferences/participant**: Participant preference management
- **/api/preferences/group**: Group preference management
- **/api/preferences/site**: Site preference management
- **/api/preferences/:preferenceName**: Preference retrieval with fallback hierarchy

The API follows RESTful principles with consistent naming and HTTP verb usage (GET, POST, PUT, DELETE), making it intuitive and predictable.

## Authentication System

The application uses JWT-based authentication with multi-tenancy support:

1. **Login Process**:
   - User provides email and password
   - Server validates credentials against the database in the appropriate schema
   - If valid, a JWT token is generated and set as an HTTP-only cookie
   - Participant events are logged for successful/failed login attempts

2. **Authentication Middleware**:
   - Extracts JWT from Authorization header or cookie
   - Verifies the token using the JWT_SECRET
   - Attaches the decoded payload to req.user
   - Returns 401 if token is missing or invalid

3. **Schema Selection Middleware**:
   - Extracts client schema from subdomain, JWT payload, or defaults to 'dev'
   - Sets the schema for database operations
   - Ensures data isolation between clients

4. **Token Management**:
   - Tokens expire after a configurable period
   - Cookies are HTTP-only for security
   - Tokens contain the participantId and clientSchema for identifying the user and tenant

## Key Components

### Multi-tenancy

The system uses schema-based multi-tenancy to provide strong data isolation between clients while sharing common lookup tables and structure. Each client has its own schema with identical table structures, while the public schema contains shared lookup tables and configuration.

### Participants

Participants are users of the system. They have authentication credentials (email/password) and can belong to multiple groups. Participants can have avatars associated with them and can set preferences including LLM configuration.

### Groups

Groups are collections of participants. A participant can belong to multiple groups with different roles. Groups contain conversations, can have an associated LLM avatar, and can have group-level preferences.

### Group Conversations (grpCons)

Conversations occur within groups and involve avatars. Each conversation has a name and description and contains a series of turns. Conversations can have a specific type.

### Avatars

Avatars are entities that can be associated with both participants and conversations. They represent characters or personas within the system and can have LLM configurations for AI-powered behavior. Avatars have scopes that determine their visibility and availability.

### Turns

Turns represent interactions or messages within a conversation. They are associated with specific avatars and have content in both text and vector form. The vector representation enables semantic search and understanding through embeddings. Turns can be regular messages or comments (using decimal indices).

### Turn Relationships

Relationships between turns establish connections like replies, references, or other semantic links, creating a graph structure within conversations.

### Participant Events

The system logs events related to participants, such as login attempts, for auditing and security purposes. Events have types and can include detailed information in JSON format.

### Preference System

The system implements a hierarchical preference system with three levels:
1. **Participant Preferences**: Settings specific to individual participants
2. **Group Preferences**: Settings that apply to all participants in a group
3. **Site Preferences**: Global settings that apply to the entire site

Preferences are retrieved with a fallback mechanism that checks participant preferences first, then group preferences, then site preferences, and finally defaults to a specified value.

### LLM Integration

The system supports integration with various language model providers (Anthropic, OpenAI) through a unified API, enabling AI-powered conversations and semantic understanding. LLM configurations are stored in the public schema and can be selected through the preference system.

### Embedding Service

The embedding service generates vector representations of text content, enabling semantic search and understanding. It supports various embedding models and includes fallback mechanisms for handling API failures.

## Relationships

- **Participants <-> Groups**: Many-to-many relationship through participant_groups table
- **Groups -> Conversations**: One-to-many relationship (a group has many conversations)
- **Conversations <-> Avatars**: Many-to-many relationship through grp_con_avatars table
- **Participants <-> Avatars**: Many-to-many relationship through participant_avatars table
- **Conversations -> Turns**: One-to-many relationship (a conversation has many turns)
- **Avatars -> Turns**: One-to-many relationship (an avatar can have many turns)
- **Turns <-> Turns**: Many-to-many relationship through turn relationships (creating a graph structure)
- **Participants -> Preferences**: One-to-many relationship (a participant can have many preferences)
- **Groups -> Preferences**: One-to-many relationship (a group can have many preferences)
- **Preference Types -> Preferences**: One-to-many relationship (a preference type can have many preferences)

## Architectural Strengths

1. **Multi-tenancy**: Strong data isolation between clients with shared structure and code
2. **Scalability**: The modular design allows for easy addition of new features
3. **Maintainability**: Clear separation of concerns makes the codebase easier to understand and modify
4. **Flexibility**: The service layer abstracts external dependencies, making it easier to switch providers
5. **Testability**: The architecture facilitates both unit and integration testing
6. **Security**: Authentication and authorization are properly implemented
7. **Preference Hierarchy**: The preference system provides flexibility and customization at multiple levels

## Potential Improvements

While the architecture is solid, there are areas that could be enhanced:

1. **API Documentation**: Implementing OpenAPI/Swagger for automated API documentation
2. **Error Handling**: A more consistent approach to error handling across layers
3. **Caching Strategy**: Implementing caching for frequently accessed data
4. **Logging Framework**: A more comprehensive logging strategy for debugging and monitoring
5. **Rate Limiting**: Adding rate limiting to API endpoints for improved security and stability
6. **Tenant Provisioning**: Automating the creation and management of client schemas
7. **Schema Migrations**: Improving the process for applying schema changes across all tenants

## Development Workflow

The project uses:
- ES Modules for modern JavaScript syntax
- Modular file organization with barrel files (index.js) for clean exports
- Environment variables for configuration
- Separate scripts for database migrations and operations
- Schema-based multi-tenancy for client isolation
- Vitest for testing