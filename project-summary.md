# Back-Stage Project Summary

This document provides a high-level overview of the Back-Stage project, its structure, and key components. It can be used as a quick reference for future development sessions.

## Project Overview

Back-Stage is a backend service for a group conversation or chat application. It provides APIs for managing participants (users), groups, conversations, avatars, and turns within conversations. The system supports authentication, participant events logging, and complex relationships between entities.

The project follows a well-structured layered architecture with clear separation of concerns:

1. **Database Layer** (`src/db/`): Handles all database operations, organized by entity
2. **API Layer** (`src/routes/`): Defines RESTful endpoints and request handling
3. **Service Layer** (`src/services/`): Implements business logic and external integrations
4. **Controller Layer** (`src/controllers/`): Manages request processing for complex operations
5. **Middleware Layer** (`src/middleware/`): Provides cross-cutting concerns like authentication

This architecture demonstrates good software engineering practices:
- **Modularity**: Each component has a single responsibility
- **Encapsulation**: Implementation details are hidden behind clear interfaces
- **Testability**: Components can be tested in isolation
- **Maintainability**: Changes to one layer don't necessarily affect others

The architecture has evolved positively under the pressure of adding new features, with recent changes including:

1. **Renaming Convention**: The shift from "groupConversation" to "grpCon" improves consistency and reduces verbosity
2. **LLM Integration**: Addition of language model capabilities for AI-powered conversations
3. **Participant Events**: Enhanced tracking for security and audit purposes
4. **Vector Embeddings**: Support for semantic understanding of conversation content

## Tech Stack

- **Runtime**: Node.js with ES Modules
- **Web Framework**: Express.js
- **Database**: PostgreSQL with vector extension for embeddings
- **Query Builder**: Knex.js
- **Authentication**: JWT (jsonwebtoken) with HTTP-only cookies
- **Password Hashing**: bcryptjs
- **Testing**: Vitest
- **LLM Integration**: Support for various LLM providers via unified API

## Project Structure

- **app.js**: Main Express application setup and route configuration
- **server.js**: Entry point that starts the HTTP server
- **src/controllers/**: Request handlers for specific operations
- **src/db/**: Database operations organized by entity
- **src/middleware/**: Express middleware (e.g., authentication)
- **src/routes/**: API route definitions
- **src/services/**: Shared services (authentication, LLM, embeddings)
- **public/**: Static files for the frontend
- **scripts/**: Utility scripts for database operations
- **sql-scripts/**: SQL scripts for database schema changes
- **test/**: Test files for various components

## Database Schema

The database includes the following main tables:

1. **participants**: Users of the system
   - id, name, email, password, created_at, current_avatar_id, llm_id

2. **groups**: Groups that participants can join
   - id, name, description, created_at

3. **participant_groups**: Junction table for many-to-many relationship between participants and groups
   - participant_id, group_id, role, created_at

4. **grp_cons** (group conversations): Conversations within groups
   - id, group_id, name, description, created_at

5. **grp_con_avatars**: Junction table for many-to-many relationship between conversations and avatars
   - grp_con_id, avatar_id, added_at

6. **grp_con_avatar_turns**: Turns (messages/interactions) within a conversation
   - id, grp_con_id, turn_kind_id, avatar_id, turn_index, content_text, content_vector, created_at

7. **grp_con_avatar_turn_relationships**: Relationships between turns
   - id, turn_id, target_turn_id, turn_relationship_type_id, created_at

8. **avatars**: AI personas with configurable behaviors
   - id, name, instruction_set, created_at, avatar_scope_id, llm_config

9. **participant_avatars**: Junction table for many-to-many relationship between participants and avatars
   - id, participant_id, avatar_id, created_at, created_by_participant_id

10. **participant_events**: Events related to participants (e.g., login, logout)
    - id, participant_id, event_type_id, details, created_at

11. **llms**: Configuration for language model providers
    - id, name, provider, model, api_key, temperature, max_tokens, additional_config

The schema demonstrates thoughtful entity-relationship modeling with appropriate use of junction tables for many-to-many relationships and proper normalization.

## API Routes

The application exposes the following API endpoints:

- **/api/participants**: Participant management (CRUD)
- **/api/participants/login**: Authentication endpoint
- **/api/groups**: Group management (CRUD)
- **/api/grp-cons**: Group conversation management
- **/api/grp-con-avatars**: Avatar associations with conversations
- **/api/grp-con-avatar-turns**: Turns within conversations
- **/api/grp-con-avatar-turn-relationships**: Relationships between turns
- **/api/participant-avatars**: Avatar associations with participants
- **/api/participant-events**: Participant event logging
- **/api/me**: Authenticated user information
- **/api/conversations**: Conversation management with LLM integration

The API follows RESTful principles with consistent naming and HTTP verb usage (GET, POST, PUT, DELETE), making it intuitive and predictable.

## Authentication System

The application uses JWT-based authentication:

1. **Login Process**:
   - User provides email and password
   - Server validates credentials against the database
   - If valid, a JWT token is generated and set as an HTTP-only cookie
   - Participant events are logged for successful/failed login attempts

2. **Authentication Middleware**:
   - Extracts JWT from Authorization header or cookie
   - Verifies the token using the JWT_SECRET
   - Attaches the decoded payload to req.user
   - Returns 401 if token is missing or invalid

3. **Token Management**:
   - Tokens expire after 1 day
   - Cookies expire after 1 hour
   - Tokens contain the participantId for identifying the user

## Key Components

### Participants

Participants are users of the system. They have authentication credentials (email/password) and can belong to multiple groups. Participants can have avatars associated with them and can select a current avatar and LLM configuration.

### Groups

Groups are collections of participants. A participant can belong to multiple groups with different roles. Groups contain conversations and can have an associated LLM avatar.

### Group Conversations (grpCons)

Conversations occur within groups and involve avatars. Each conversation has a name and description and contains a series of turns.

### Avatars

Avatars are entities that can be associated with both participants and conversations. They represent characters or personas within the system and can have LLM configurations for AI-powered behavior.

### Turns

Turns represent interactions or messages within a conversation. They are associated with specific avatars and have content in both text and vector form. The vector representation enables semantic search and understanding through embeddings.

### Turn Relationships

Relationships between turns establish connections like replies, references, or other semantic links, creating a graph structure within conversations.

### Participant Events

The system logs events related to participants, such as login attempts, for auditing and security purposes.

### LLM Integration

The system supports integration with various language model providers through a unified API, enabling AI-powered conversations and semantic understanding.

## Relationships

- **Participants <-> Groups**: Many-to-many relationship through participant_groups table
- **Groups -> Conversations**: One-to-many relationship (a group has many conversations)
- **Conversations <-> Avatars**: Many-to-many relationship through grp_con_avatars table
- **Participants <-> Avatars**: Many-to-many relationship through participant_avatars table
- **Conversations -> Turns**: One-to-many relationship (a conversation has many turns)
- **Avatars -> Turns**: One-to-many relationship (an avatar can have many turns)
- **Turns <-> Turns**: Many-to-many relationship through turn relationships (creating a graph structure)
- **Participants -> LLMs**: Many-to-one relationship (participants can select an LLM configuration)

## Architectural Strengths

1. **Scalability**: The modular design allows for easy addition of new features
2. **Maintainability**: Clear separation of concerns makes the codebase easier to understand and modify
3. **Flexibility**: The service layer abstracts external dependencies, making it easier to switch providers
4. **Testability**: The architecture facilitates both unit and integration testing
5. **Security**: Authentication and authorization are properly implemented

## Potential Improvements

While the architecture is solid, there are areas that could be enhanced:

1. **API Documentation**: Implementing OpenAPI/Swagger for automated API documentation
2. **Error Handling**: A more consistent approach to error handling across layers
3. **Caching Strategy**: Implementing caching for frequently accessed data
4. **Logging Framework**: A more comprehensive logging strategy for debugging and monitoring
5. **Rate Limiting**: Adding rate limiting to API endpoints for improved security and stability

## Development Workflow

The project uses:
- ES Modules for modern JavaScript syntax
- Modular file organization with barrel files (index.js) for clean exports
- Environment variables for configuration
- Separate scripts for database migrations and operations
- Vitest for testing