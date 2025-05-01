# Back-Stage Project Summary

This document provides a high-level overview of the Back-Stage project, its structure, and key components. It can be used as a quick reference for future development sessions.

## Project Overview

Back-Stage appears to be a backend service for a group conversation or chat application. It provides APIs for managing participants (users), groups, conversations, avatars, and turns within conversations. The system supports authentication, participant events logging, and complex relationships between entities.

## Tech Stack

- **Runtime**: Node.js with ES Modules
- **Web Framework**: Express.js
- **Database**: PostgreSQL
- **Query Builder**: Knex.js
- **Authentication**: JWT (jsonwebtoken) with HTTP-only cookies
- **Password Hashing**: bcryptjs
- **Testing**: Vitest

## Project Structure

- **app.js**: Main Express application setup and route configuration
- **server.js**: Entry point that starts the HTTP server
- **src/controllers/**: Request handlers for specific operations
- **src/db/**: Database operations organized by entity
- **src/middleware/**: Express middleware (e.g., authentication)
- **src/routes/**: API route definitions
- **src/services/**: Shared services (e.g., authentication)
- **public/**: Static files for the frontend
- **scripts/**: Utility scripts for database operations
- **sql-scripts/**: SQL scripts for database schema changes
- **test/**: Test files for various components

## Database Schema

The database includes the following main tables:

1. **participants**: Users of the system
   - id, name, email, password, created_at

2. **groups**: Groups that participants can join
   - id, name, created_at

3. **participant_groups**: Junction table for many-to-many relationship between participants and groups
   - participant_id, group_id, role

4. **grp_cons** (group conversations): Conversations within groups
   - id, group_id, name, description, created_at

5. **grp_con_avatars**: Junction table for many-to-many relationship between conversations and avatars
   - grp_con_id, avatar_id, added_at

6. **grp_con_avatar_turns**: Turns (messages/interactions) within a conversation
   - id, grp_con_id, turn_kind_id, avatar_id, turn_index, content_text, content_vector, created_at

7. **participant_avatars**: Junction table for many-to-many relationship between participants and avatars
   - participant_id, avatar_id

8. **participant_events**: Events related to participants (e.g., login, logout)
   - id, participant_id, event_type_id, event_data, created_at

## API Routes

The application exposes the following API endpoints:

- **/api/participants**: Participant management (CRUD)
- **/api/participants/login**: Authentication endpoint
- **/api/groups**: Group management (CRUD)
- **/api/group-conversations**: Group conversation management
- **/api/grp-con-avatars**: Avatar associations with conversations
- **/api/group-conversation-avatar-turns**: Turns within conversations
- **/api/grp-con-avatar-turn-relationships**: Relationships between turns
- **/api/participant-avatars**: Avatar associations with participants
- **/api/participant-events**: Participant event logging
- **/api/me**: Authenticated user information

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

Participants are users of the system. They have authentication credentials (email/password) and can belong to multiple groups. Participants can have avatars associated with them.

### Groups

Groups are collections of participants. A participant can belong to multiple groups with different roles. Groups contain conversations.

### Group Conversations (grpCons)

Conversations occur within groups and involve avatars. Each conversation has a name and description.

### Avatars

Avatars are entities that can be associated with both participants and conversations. They represent characters or personas within the system.

### Turns

Turns represent interactions or messages within a conversation. They are associated with specific avatars and have content in both text and vector form. The vector representation suggests the use of embeddings for semantic understanding.

### Participant Events

The system logs events related to participants, such as login attempts, for auditing and security purposes.

## Relationships

- **Participants <-> Groups**: Many-to-many relationship through participant_groups table
- **Groups -> Conversations**: One-to-many relationship (a group has many conversations)
- **Conversations <-> Avatars**: Many-to-many relationship through grp_con_avatars table
- **Participants <-> Avatars**: Many-to-many relationship through participant_avatars table
- **Conversations -> Turns**: One-to-many relationship (a conversation has many turns)
- **Avatars -> Turns**: One-to-many relationship (an avatar can have many turns)

## Development Workflow

The project uses:
- ES Modules for modern JavaScript syntax
- Modular file organization with barrel files (index.js) for clean exports
- Environment variables for configuration
- Separate scripts for database migrations and operations
- Vitest for testing