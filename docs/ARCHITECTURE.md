# Back-Stage Architecture

## Overview
Back-Stage is a multi-tenant application for managing conversations, topics, and LLM interactions. The system is built with a React frontend and Node.js/Express backend, using PostgreSQL for data storage.

## Core Concepts

### Multi-tenancy
- Schema-based isolation (bsa, conflict_club, dev, etc.)
- Shared codebase with tenant-specific configurations
- Schema selection based on subdomain
- Client and schema management through structured database tables

### Key Components

#### Frontend Architecture

#### Core Technologies
- React 18+ with functional components and hooks
- React Router for client-side routing
- CSS Modules for component-scoped styling
- Axios for API requests

#### State Management
- React Context API for global state
- Custom hooks for data fetching and state logic
- Local component state for UI-specific state

#### Component Structure
```
src/
  components/     # Reusable UI components
    common/      # Basic building blocks (Button, Input, etc.)
    layout/      # Layout components (Header, Sidebar, etc.)
    features/    # Feature-specific components
  pages/         # Page-level components
  hooks/         # Custom React hooks
  services/      # API service layer
  utils/         # Utility functions
  contexts/      # React Context providers
```

#### Backend Architecture

#### Core Technologies
- Node.js with Express.js
- PostgreSQL with pgvector for embeddings
- JWT for authentication
- Winston for logging

#### API Structure
```
src/
  config/        # Configuration files
  controllers/    # Request handlers
  db/            # Database access layer
    core/        # Core database utilities
    models/      # Data models and schemas
    queries/     # Database queries
  middleware/    # Express middleware
  routes/        # Route definitions
  services/      # Business logic
  utils/         # Utility functions
```

#### Authentication Flow
1. User logs in with email/password
2. Server verifies credentials and issues JWT
3. JWT is stored in HTTP-only cookie
4. Subsequent requests include JWT for authorization

#### Error Handling
- Centralized error handling middleware
- Standardized error responses
- Detailed error logging

#### Database
- PostgreSQL with pgvector for embeddings
- Schema-per-tenant model
- Key tables:
  - `clients`: Client organizations
  - `client_schemas`: Association between clients and database schemas
  - `client_schema_preferences`: Schema-specific preferences (replaces site_preferences)
  - `participants`: System users
  - `topic_paths`: Hierarchical organization of content
  - `llms`: LLM configurations
  - `conversations`: Chat threads
  - `turns`: Individual messages in conversations

### Client and Schema Management

#### Clients
- Represents client organizations
- Each client can have multiple schemas
- Central point for client-specific settings and preferences

#### Schema Management
- Schemas are associated with clients through `client_schemas`
- Each schema can have its own preferences
- Preferences are stored in `client_schema_preferences` with references to `preference_types`
- Replaces the previous `site_preferences` table with a more structured approach

#### Preference System
- Uses `preference_types` for type safety
- Supports different value types through `preference_value` (stored as text)
- Enforces unique preferences per schema through constraints
- Enables flexible configuration at the schema level

## Recent Changes

### Client and Schema Management (2025-05-16)
- Added client and schema management tables
- Replaced site_preferences with client_schema_preferences
- Added support for schema-specific preferences
- [See decision](./decisions/2025-05-16-client-and-schema-management.md)

### Documentation System (2025-05-16)
- Added structured documentation system
- Automated decision tracking
- [See decision](./decisions/2025-05-16-documentation-structure.md)

### LLM Integration (2025-05-16)
- Schema-level LLM configurations
- Topic path-specific overrides
- Support for multiple LLM providers
- [See decision](./decisions/2025-05-16-llm-preference-hierarchy.md)

## Getting Started

### Development Setup
1. Install dependencies:
   ```powershell
   Set-Location backend
   npm install
   Set-Location ..\frontend
   npm install
   ```

2. Set up environment variables (copy from .env.example)

3. Start the development servers:
   ```powershell
   # In one terminal
   Set-Location backend
   npm start
   
   # In another terminal
   Set-Location ..\frontend
   npm start
   ```

## Documentation
- [Architectural Decisions](./decisions/README.md)
- [API Documentation](./api/README.md)
- [Database Schema](../neon_schema.sql)

## Related Projects
- [Frontend](../frontend/README.md)
- [Backend](../backend/README.md)
