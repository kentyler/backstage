# Project Documentation

## C:\Users\Ken\Desktop\back-stage\cli.js

```
Create a new participant, but handle 409 conflict with a friendly message.
```

## C:\Users\Ken\Desktop\back-stage\server.js

```
Main entry point: start the Express server.
Supports both HTTP and HTTPS based on environment and certificate availability.
- Development: Uses mkcert certificates if available, falls back to HTTP
- Production: Adapts to platform SSL configuration
```

```
Check if SSL certificates exist
@returns {Object|null} SSL options if certificates exist, null otherwise
```

```
Detect if the app is running behind a reverse proxy that handles SSL
Common in production environments like Heroku, Render, etc.
```

## C:\Users\Ken\Desktop\back-stage\scripts\add-comments-feature.js

```
@file scripts/add-comments-feature.js
@description Script to apply database changes for the comments feature
This script:
1. Changes the turn_index column in grp_con_avatar_turns from integer to numeric(10,2)
2. Adds a new turn_kind for comments in the turn_kinds table
```

## C:\Users\Ken\Desktop\back-stage\scripts\add-llm-config-to-avatars.js

```
@file scripts/add-llm-config-to-avatars.js
@description Script to add llm_config JSON field to avatars table
```

## C:\Users\Ken\Desktop\back-stage\scripts\add-preference-tables.js

```
@file scripts/add-preference-tables.js
@description Script to add preference tables to the database
```

## C:\Users\Ken\Desktop\back-stage\scripts\add-token-limit-to-llms.js

```
Script to add token_limit column to llms table
This script adds a token_limit column to the llms table and updates existing records
with appropriate token limits for different models.
```

## C:\Users\Ken\Desktop\back-stage\scripts\change-preference-value-to-bigint.js

```
Script to change site_preferences.value from JSONB to BIGINT
This script executes the SQL in sql-scripts/change-preference-value-to-bigint.sql
which extracts the LLM ID from the JSON object and stores it directly as a number.
```

## C:\Users\Ken\Desktop\back-stage\scripts\check-env.js

```
Script to check the environment variables needed for database connection
Run this script to verify your .env file is configured properly
```

## C:\Users\Ken\Desktop\back-stage\scripts\create-client-schema.js

```
Script to create a client schema programmatically
This script creates a new schema for a client and duplicates all tables
from the dev schema to the client schema. The dev schema contains the
latest tested changes and is used as the source for table structures.
This approach allows for:
1. Strong data isolation between clients
2. Shared structure across all client schemas
3. The public schema can still be used for shared data or as a template
Usage: node scripts/create-client-schema.js <client_name>
Example: node scripts/create-client-schema.js client1
```

## C:\Users\Ken\Desktop\back-stage\scripts\create-supabase-buckets.js

```
Script to create Supabase buckets for each client schema
This script creates a bucket in Supabase Storage for each client schema.
Each bucket is named after the client schema and is configured to:
- Be private (not public)
- Accept only text files
- Have a 10MB file size limit
```

```
Creates a bucket in Supabase Storage if it doesn't already exist
@param {string} bucketName - Name of the bucket to create
@returns {Promise<void>}
```

```
Main function to create buckets for all client schemas
```

## C:\Users\Ken\Desktop\back-stage\scripts\create-supabase-rls-policies.js

```
Script to create RLS policies for Supabase Storage
This script creates the necessary RLS policies to allow file uploads
to Supabase Storage buckets. It creates policies for:
- INSERT: Allow file uploads
- SELECT: Allow file downloads
- DELETE: Allow file deletions
```

```
Creates RLS policies for a bucket
@param {string} bucketName - Name of the bucket
@returns {Promise<void>}
```

```
Main function to create RLS policies for all buckets
```

## C:\Users\Ken\Desktop\back-stage\scripts\fix-participant-events-sequence.js

```
Script to fix the participant_events sequence
This script executes the SQL in sql-scripts/fix-participant-events-sequence.sql
to ensure the id column in participant_events has a properly attached sequence
```

## C:\Users\Ken\Desktop\back-stage\scripts\fix-sequences.js

```
Script to fix sequences in schemas
Usage: node scripts/fix-sequences.js <schema_name>
Example: node scripts/fix-sequences.js dev
This script:
1. Reads the SQL script from sql-scripts/fix-sequences.sql
2. Executes it using the database connection
3. Fixes sequences in the specified schema
```

## C:\Users\Ken\Desktop\back-stage\scripts\migrate-llms-to-public.js

```
Script to migrate the llms table from client schemas to the public schema
This script runs the SQL script to migrate the llms table from client schemas to the public schema.
It adds a 'subdomain' column to the llms table and sets it to the client schema name for each record.
Usage: node scripts/migrate-llms-to-public.js
```

## C:\Users\Ken\Desktop\back-stage\scripts\migrate-lookup-tables-to-public.js

```
Script to migrate lookup tables to public schema
This script runs the SQL script to migrate lookup tables from client schemas back to the public schema.
It's designed to be run after the initial multi-tenancy setup when you want to switch to keeping
lookup tables only in the public schema.
Usage: node scripts/migrate-lookup-tables-to-public.js
```

## C:\Users\Ken\Desktop\back-stage\scripts\remove-non-lookup-tables-from-public.js

```
Script to remove non-lookup tables from public schema
This script runs the SQL script to remove non-lookup tables from the public schema.
It's designed to be run after the initial multi-tenancy setup and after migrating
lookup tables to the public schema.
Usage: node scripts/remove-non-lookup-tables-from-public.js
```

## C:\Users\Ken\Desktop\back-stage\scripts\rename-group-conversation-to-grp-con.js

```
@file scripts/rename-group-conversation-to-grp-con.js
@description Helper script to identify files and code that need to be updated
when renaming from groupConversation to grpCon
```

```
This script helps identify files that need to be renamed and code that needs to be updated.
It doesn't actually make the changes - it just provides guidance.
To use this script:
1. Run it to see what files need to be renamed and what code needs to be updated
2. Manually rename the directories and files
3. Update the code in each file
Note: This is a complex change that affects many parts of the codebase.
It's recommended to make these changes incrementally and test thoroughly after each step.
```

## C:\Users\Ken\Desktop\back-stage\scripts\setup-multi-tenancy.js

```
Script to set up multi-tenancy programmatically
This script runs the SQL script to set up schema-based multi-tenancy with:
1. A 'dev' schema with all existing data from the public schema
2. Three client schemas ('conflict_club', 'first_congregational', 'bsa') with only lookup table data
Usage: node scripts/setup-multi-tenancy.js
```

## C:\Users\Ken\Desktop\back-stage\scripts\test-db-connection.js

```
Simple script to test database connectivity
Run this script to verify that your database configuration works
```

```
Test database connection and basic queries
```

## C:\Users\Ken\Desktop\back-stage\scripts\update-max-tokens-in-llms.js

```
Script to update max_tokens in llms table with appropriate values for different models
This script executes the SQL in sql-scripts/add-token-limit-to-llms.sql
which updates the max_tokens field to represent the model's context window size
```

## C:\Users\Ken\Desktop\back-stage\scripts\verify-preference-types.js

```
Script to verify preference types in the database
This script checks if specific preference types exist and logs their properties
```

## C:\Users\Ken\Desktop\back-stage\src\config\schema.js

```
@file src/config/schema.js
@description Configuration for database schema selection
This file provides functions for getting and setting the default schema
to use for database operations. The schema can be configured via
environment variables or set programmatically.
```

```
Get the current default schema
@returns {string} The current default schema
```

```
Set the default schema
@param {string} schema - The schema to use as default
```

```
Get a connection pool for the specified schema
@param {string} [schema=null] - The schema to use (optional, defaults to current default schema)
@returns {Object} A connection pool for the specified schema
```

## C:\Users\Ken\Desktop\back-stage\src\controllers\participants\loginHandler.js

```
Handles participant login requests and sets an HttpOnly cookie
```

## C:\Users\Ken\Desktop\back-stage\src\controllers\participants\logoutHandler.js

```
Handles participant logout requests and clears the HttpOnly cookie
```

## C:\Users\Ken\Desktop\back-stage\src\db\connection.js

```
Database connection module
Provides a PostgreSQL connection pool for the application
Supports schema-based multi-tenancy
```

```
Creates a database connection pool with a specific schema search path
@param {string} schema - The schema to use (defaults to 'public')
@returns {Pool} - A PostgreSQL connection pool configured for the specified schema
```

## C:\Users\Ken\Desktop\back-stage\src\db\groups\createGroup.js

```
@file src/db/group/createGroup.js
@description Creates a new group record in the database.
```

```
Creates a new group with the given name.
*
@param {string} name - The name of the group.
@returns {Promise<{id: number, name: string, created_at: string}>} The newly created group record.
```

## C:\Users\Ken\Desktop\back-stage\src\db\groups\deleteGroup.js

```
@file src/db/group/deleteGroup.js
@description Deletes a group by its ID.
```

```
Deletes a group from the database.
*
@param {number} groupId - The ID of the group to delete.
@returns {Promise<boolean>} True if a group was deleted, false otherwise.
```

## C:\Users\Ken\Desktop\back-stage\src\db\groups\getAllGroups.js

```
@file src/db/group/getAllGroups.js
@description Retrieves all group records from the database.
```

```
Retrieves all groups from the database.
*
@param {string} [schema=null] - The schema to use for database operations (optional)
@returns {Promise<Array<{id: number, name: string, created_at: string}>>} Array of group records.
```

## C:\Users\Ken\Desktop\back-stage\src\db\groups\getGroupById.js

```
@file src/db/group/getGroupById.js
@description Retrieves a group record from the database by its ID.
```

```
Retrieves a single group by its ID.
*
@param {number} id - The ID of the group to retrieve.
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<{id: number, name: string, created_at: string}|null>} The group record, or null if not found.
```

## C:\Users\Ken\Desktop\back-stage\src\db\groups\getGroupByName.js

```
@file src/db/group/getGroupByName.js
@description Retrieves a group record from the database by its name.
```

```
Retrieves a single group by its name.
*
@param {string} name - The name of the group to retrieve.
@returns {Promise<{id: number, name: string, created_at: string}|null>} The group record, or null if not found.
```

## C:\Users\Ken\Desktop\back-stage\src\db\groups\getGroupsByParticipant.js

```
@file src/db/groups/getGroupsByParticipant.js
@description Retrieves all groups that a specific participant belongs to.
```

```
The database connection pool and schema utilities
```

```
Retrieves all groups that a specific participant belongs to
@param {number} participantId - The ID of the participant
@param {string|object} [schemaOrPool=null] - Database schema name or connection pool
@returns {Promise<Array<{id: number, name: string, created_at: string, role: string}>>} Array of group records
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\src\db\groups\updateGroup.js

```
@file src/db/group/updateGroup.js
@description Updates a group's properties in the database.
```

```
Updates an existing group's properties.
*
@param {number} groupId - The ID of the group to update.
@param {Object} updates - The properties to update.
@param {string} [updates.name] - The new name for the group.
@returns {Promise<{id: number, name: string, created_at: string}|null>} The updated group record, or null if not found.
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConAvatars\createGrpConAvatar.js

```
@file src/db/grpConAvatars/createGrpConAvatar.js
@description Adds an avatar to a group conversation.
```

```
Inserts a new row into grp_con_avatars.
*
@param {number} conversationId
@param {number} avatarId
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<{grp_con_id: number, avatar_id: number, added_at: string}>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConAvatars\deleteGrpConAvatar.js

```
@file src/db/grpConAvatars/deleteGrpConAvatar.js
@description Removes an avatar from a conversation.
```

```
Deletes the link between an avatar and a conversation.
*
@param {number} conversationId
@param {number} avatarId
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<boolean>} true if deleted, false otherwise
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConAvatars\getGrpConAvatarsByConversation.js

```
@file src/db/grpConAvatars/getGrpConAvatarsByConversation.js
@description Lists all avatars in a given conversation.
```

```
Fetches avatar entries for one conversation.
*
@param {number} conversationId
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<Array<{avatar_id: number, added_at: string}>>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConAvatars\getGrpConsByAvatar.js

```
@file src/db/grpConAvatars/getGrpConsByAvatar.js
@description Lists all conversations that include a given avatar.
```

```
Fetches conversation entries for one avatar.
*
@param {number} avatarId
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<Array<{grp_con_id: number, added_at: string}>>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConAvatarTurnRelationships\createGrpConAvatarTurnRelationship.js

```
Creates a directed relationship between two avatar turns.
@param {number} turnId
@param {number} targetTurnId
@param {number} [relationshipTypeId=1]
@returns {Promise<object>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConAvatarTurnRelationships\deleteGrpConAvatarTurnRelationship.js

```
Deletes a relationship by its ID.
@param {number} id
@returns {Promise<boolean>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConAvatarTurnRelationships\getGrpConAvatarTurnRelationshipById.js

```
Fetches a relationship by its ID.
@param {number} id
@returns {Promise<object|null>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConAvatarTurnRelationships\getGrpConAvatarTurnRelationshipsByTurn.js

```
Lists all relationships originating from a turn.
@param {number} turnId
@returns {Promise<object[]>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConAvatarTurnRelationships\updateGrpConAvatarTurnRelationship.js

```
Updates the relationship type of an existing relationship.
@param {number} id
@param {number} newTypeId
@returns {Promise<object|null>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConAvatarTurns\createGrpConAvatarTurn.js

```
Creates a new avatar turn in a group conversation
@param {number} conversationId - The ID of the conversation
@param {number} avatarId - The ID of the avatar
@param {number|string} turnIndex - The index of the turn (can be decimal for comments)
@param {string} contentText - The text content of the turn
@param {Array} contentVector - The vector representation of the content
@param {number} [turnKindId=TURN_KIND.REGULAR] - The kind of turn (regular or comment)
@param {string|object} schemaOrPool - Either a schema name or a pool object
@returns {Promise<Object>} The created turn
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConAvatarTurns\deleteGrpConAvatarTurn.js

```
Delete a group conversation avatar turn by ID
@param {number} id - The ID of the turn to delete
@param {string|object} schemaOrPool - Either a schema name or a pool object
@returns {Promise<boolean>} True if the turn was deleted, false if not found
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConAvatarTurns\getGrpConAvatarTurnById.js

```
Get a group conversation avatar turn by ID
@param {number} id - The ID of the turn to retrieve
@param {string|object} schemaOrPool - Either a schema name or a pool object
@returns {Promise<object|null>} The turn object or null if not found
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConAvatarTurns\getGrpConAvatarTurnsByConversation.js

```
Parse a vector string from the database into an array of numbers
@param {string} vectorStr - The vector string from the database (e.g., "[0.1,0.2,0.3]")
@returns {number[]} The parsed vector as an array of numbers
```

```
Get all avatar turns for a specific conversation
@param {number} conversationId - The ID of the conversation
@param {string|object} [schemaOrPool=null] - Schema name or custom pool
@returns {Promise<Array>} List of avatar turns for the conversation
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConAvatarTurns\updateGrpConAvatarTurn.js

```
Update a group conversation avatar turn
@param {number} id - The ID of the turn to update
@param {string} newText - The new text content
@param {Array<number>} newVector - The new vector content
@param {string|object} schemaOrPool - Either a schema name or a pool object
@returns {Promise<object>} The updated turn
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpCons\createGrpCon.js

```
Creates a new conversation under a group.
@param {number} groupId - The ID of the group.
@param {string} name - The conversation name.
@param {string} description - The conversation description.
@param {number} [typeId=1] - The type ID from grp_con_types table (1=conversation, 2=template)
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpCons\deleteGrpCon.js

```
Deletes a conversation by its ID.
@param {number} id - The conversation ID.
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<boolean>} True if deleted, false otherwise.
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpCons\getGrpConById.js

```
Retrieves a conversation by its ID.
@param {number} id - The conversation ID.
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}|null>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpCons\getGrpConsByGroup.js

```
Retrieves conversations for a given group, ordered by creation date (newest first) and limited to 50.
Optionally filters by conversation type.
@param {number} groupId - The group ID.
@param {number|null} [typeId=null] - The type ID to filter by (1=conversation, 2=template), or null for all types
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<Array<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}>>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpCons\updateGrpCon.js

```
Updates a conversation's name, description, and optionally its type.
@param {number} id - The conversation ID.
@param {string} newName - The new conversation name.
@param {string} newDescription - The new conversation description.
@param {number|null} [newTypeId=null] - The new type ID from grp_con_types table (1=conversation, 2=template), or null to keep current type
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}|null>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConUploads\createGrpConUpload.js

```
Create a new group conversation upload record
@module db/grpConUploads/createGrpConUpload
```

```
Create a new group conversation upload record
@param {Object} uploadData - The upload data
@param {number} uploadData.grpConId - The group conversation ID
@param {number} [uploadData.turnId] - The turn ID (optional)
@param {string} uploadData.filename - The filename
@param {string} uploadData.mimeType - The MIME type
@param {string} uploadData.filePath - The file path in Supabase Storage
@param {string} [uploadData.publicUrl] - The public URL of the file (optional)
@param {string} [uploadData.bucketName] - The Supabase Storage bucket name (optional)
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<Object>} - The created upload record
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConUploads\deleteGrpConUpload.js

```
Delete a group conversation upload record
@module db/grpConUploads/deleteGrpConUpload
```

```
Delete a group conversation upload record
@param {number} id - The upload ID
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<boolean>} - True if deletion was successful
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConUploads\getGrpConUploadById.js

```
Get a group conversation upload by ID
@module db/grpConUploads/getGrpConUploadById
```

```
Get a group conversation upload by ID
@param {number} id - The upload ID
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<Object|null>} - The upload record or null if not found
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConUploads\getGrpConUploadsByConversation.js

```
Get all uploads for a specific group conversation
@module db/grpConUploads/getGrpConUploadsByConversation
```

```
Get all uploads for a specific group conversation
@param {number} grpConId - The group conversation ID
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<Array>} - Array of upload records
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpConUploads\index.js

```
Group conversation uploads database operations
@module db/grpConUploads
```

## C:\Users\Ken\Desktop\back-stage\src\db\participantAvatars\createParticipantAvatar.js

```
@file src/db/participantAvatars/createParticipantAvatar.js
@description Creates a new participant-avatar relationship.
```

```
Creates a new participant-avatar relationship.
*
@param {number} participantId - The ID of the participant
@param {number} avatarId - The ID of the avatar
@param {number} [createdByParticipantId=null] - The ID of the participant who created this relationship
@param {object} [customPool=pool] - Database connection pool (for testing)
@returns {Promise<object>} The newly created participant-avatar relationship
@throws {Error} If the operation fails
```

## C:\Users\Ken\Desktop\back-stage\src\db\participantAvatars\deleteParticipantAvatar.js

```
@file src/db/participantAvatars/deleteParticipantAvatar.js
@description Deletes a participant-avatar relationship.
```

```
Deletes a participant-avatar relationship by ID.
*
@param {number} id - The ID of the participant-avatar relationship to delete
@param {object} [customPool=pool] - Database connection pool (for testing)
@returns {Promise<object|null>} The deleted relationship or null if not found
@throws {Error} If the operation fails
```

## C:\Users\Ken\Desktop\back-stage\src\db\participantAvatars\getParticipantAvatarById.js

```
@file src/db/participantAvatars/getParticipantAvatarById.js
@description Retrieves a participant-avatar relationship by ID.
```

```
Retrieves a participant-avatar relationship by ID.
*
@param {number} id - The ID of the participant-avatar relationship
@param {object} [customPool=pool] - Database connection pool (for testing)
@returns {Promise<object|null>} The participant-avatar relationship or null if not found
@throws {Error} If the operation fails
```

## C:\Users\Ken\Desktop\back-stage\src\db\participantAvatars\getParticipantAvatarsByAvatar.js

```
@file src/db/participantAvatars/getParticipantAvatarsByAvatar.js
@description Retrieves all participant relationships for a specific avatar.
```

```
Retrieves all participant relationships for a specific avatar.
*
@param {number} avatarId - The ID of the avatar
@param {object} [customPool=pool] - Database connection pool (for testing)
@returns {Promise<Array<object>>} Array of participant-avatar relationships
@throws {Error} If the operation fails
```

## C:\Users\Ken\Desktop\back-stage\src\db\participantAvatars\getParticipantAvatarsByParticipant.js

```
@file src/db/participantAvatars/getParticipantAvatarsByParticipant.js
@description Retrieves all avatar relationships for a specific participant.
```

```
Retrieves all avatar relationships for a specific participant.
*
@param {number} participantId - The ID of the participant
@param {object} [customPool=pool] - Database connection pool (for testing)
@returns {Promise<Array<object>>} Array of participant-avatar relationships
@throws {Error} If the operation fails
```

## C:\Users\Ken\Desktop\back-stage\src\db\participantAvatars\index.js

```
@file src/db/participantAvatars/index.js
@description Exports all participant-avatar relationship database operations.
```

## C:\Users\Ken\Desktop\back-stage\src\db\participantEvents\createParticipantEvent.js

```
@file src/db/participantEvents/createParticipantEvent.js
@description Creates a new participant event record in the database.
```

```
Creates a new participant event in the database
@param {number} participantId - The ID of the participant
@param {number} eventTypeId - The ID of the event type
@param {object} [details=null] - Optional JSON details about the event
@param {string|object} [schemaOrPool=null] - Schema name or database connection pool
@returns {Promise<object>} The newly created participant event record
@throws {Error} If an error occurs during creation
```

## C:\Users\Ken\Desktop\back-stage\src\db\participantEvents\getParticipantEventById.js

```
@file src/db/participantEvents/getParticipantEventById.js
@description Retrieves a participant event by its ID.
```

```
Retrieves a participant event by its ID
@param {number} id - The ID of the participant event to retrieve
@param {string|object} [schemaOrPool=null] - Schema name or database connection pool
@returns {Promise<object|null>} The participant event record or null if not found
@throws {Error} If an error occurs during retrieval
```

## C:\Users\Ken\Desktop\back-stage\src\db\participantEvents\getParticipantEventsByParticipant.js

```
@file src/db/participantEvents/getParticipantEventsByParticipant.js
@description Retrieves all events for a specific participant.
```

```
Retrieves all events for a specific participant
@param {number} participantId - The ID of the participant
@param {string|object} [schemaOrPool=null] - Schema name or database connection pool
@returns {Promise<Array>} Array of participant event records
@throws {Error} If an error occurs during retrieval
```

## C:\Users\Ken\Desktop\back-stage\src\db\participantEvents\getParticipantEventsByType.js

```
@file src/db/participantEvents/getParticipantEventsByType.js
@description Retrieves all events of a specific type.
```

```
Retrieves all events of a specific type
@param {number} eventTypeId - The ID of the event type
@param {string|object} [schemaOrPool=null] - Schema name or database connection pool
@returns {Promise<Array>} Array of participant event records
@throws {Error} If an error occurs during retrieval
```

## C:\Users\Ken\Desktop\back-stage\src\db\participantEvents\index.js

```
@file src/db/participantEvents/index.js
@description Export all participant events database functions
```

## C:\Users\Ken\Desktop\back-stage\src\db\participants\createParticipant.js

```
@file src/db/participant/createParticipant.js
@description Creates a new participant record in the database.
```

```
The database connection pool
```

```
Creates a new participant in the database
@param {string} name - The name of the participant
@param {string} email - The email of the participant (must be unique)
@param {string} password - The hashed password for the participant
@param {object} [pool=defaultPool] - Database connection pool (for testing)
@returns {Promise<object>} The newly created participant record
@throws {Error} If email already exists or another error occurs
```

## C:\Users\Ken\Desktop\back-stage\src\db\participants\createParticipantHandler.js

```
@file src/api/participants/createParticipantHandler.js
@description Handler for creating a new participant.
```

```
Handles request to create a new participant
@param {object} req - Express request object
@param {object} req.body - Request body
@param {string} req.body.name - Participant name
@param {string} req.body.email - Participant email
@param {string} req.body.password - Participant password (will be hashed)
@param {object} res - Express response object
@returns {Promise<void>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\participants\deleteParticipant.js

```
@file src/db/participant/deleteParticipant.js
@description Deletes a participant by ID from the database.
```

```
The database connection pool
```

```
Deletes a participant from the database
@param {number} id - The ID of the participant to delete
@param {object} [pool=defaultPool] - Database connection pool (for testing)
@returns {Promise<boolean>} True if a participant was deleted, false otherwise
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\src\db\participants\deleteParticipantHandler.js

```
@file src/api/participants/deleteParticipantHandler.js
@description Handler for deleting a participant.
```

```
Handles request to delete a participant
@param {object} req - Express request object
@param {object} req.params - Request parameters
@param {string} req.params.id - Participant ID
@param {object} res - Express response object
@returns {Promise<void>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\participants\getAllParticipants.js

```
@file src/db/participant/getAllParticipants.js
@description Retrieves all participant records from the database.
```

```
The database connection pool
```

```
Retrieves all participants from the database
@param {object} [pool=defaultPool] - Database connection pool (for testing)
@returns {Promise<object[]>} Array of participant records
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\src\db\participants\getAllParticipantsHandler.js

```
@file src/api/participants/getAllParticipantsHandler.js
@description Handler for retrieving all participants.
```

```
Handles request to get all participants
@param {object} req - Express request object
@param {object} res - Express response object
@returns {Promise<void>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\participants\getParticipantByEmail.js

```
@file src/db/participant/getParticipantByEmail.js
@description Retrieves a participant record from the database by email address.
```

```
The database connection pool and schema utilities
```

```
Retrieves a participant by their email address
@param {string} email - The email of the participant to retrieve
@param {string|object} [schemaOrPool=null] - Schema name or database connection pool
@returns {Promise<object|null>} The participant record, or null if not found
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\src\db\participants\getParticipantById.js

```
@file src/db/participant/getParticipantById.js
@description Retrieves a participant record from the database by its ID.
```

```
The database connection pool and pool factory
```

```
Retrieves a participant by their ID
@param {number} id - The ID of the participant to retrieve
@param {string} [schema='public'] - The database schema to use
@param {object} [pool=null] - Database connection pool (for testing)
@returns {Promise<object|null>} The participant record, or null if not found
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\src\db\participants\getParticipantByIdHandler.js

```
@file src/api/participants/getParticipantByIdHandler.js
@description Handler for retrieving a participant by ID.
```

```
Handles request to get a participant by ID
@param {object} req - Express request object
@param {object} req.params - Request parameters
@param {string} req.params.id - Participant ID
@param {object} res - Express response object
@returns {Promise<void>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\participants\getParticipantsByGroup.js

```
@file src/db/participant/getParticipantsByGroup.js
@description Retrieves all participants in a specific group.
```

```
The database connection pool
```

```
Retrieves all participants in a specific group
@param {number} groupId - The ID of the group
@param {object} [pool=defaultPool] - Database connection pool (for testing)
@returns {Promise<object[]>} Array of participant records with their roles in the group
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\src\db\participants\getParticipantsByGroupHandler.js

```
@file src/api/participants/getParticipantsByGroupHandler.js
@description Handler for retrieving all participants in a group.
```

```
Handles request to get all participants in a group
@param {object} req - Express request object
@param {object} req.params - Request parameters
@param {string} req.params.groupId - Group ID
@param {object} res - Express response object
@returns {Promise<void>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\participants\index.js

```
@file src/db/participants/index.js
@description Exports all participant-related database operations.
```

## C:\Users\Ken\Desktop\back-stage\src\db\participants\updateParticipant.js

```
@file src/db/participant/updateParticipant.js
@description Updates a participant's information in the database.
```

```
The database connection pool
```

```
Updates a participant's information
@param {number} id - The ID of the participant to update
@param {object} updates - Object containing fields to update
@param {string} [updates.name] - Updated name
@param {string} [updates.email] - Updated email
@param {string} [updates.password] - Updated password (should be hashed)
@param {number} [createdByParticipantId=null] - ID of participant making the change (for logging)
@param {object} [pool=defaultPool] - Database connection pool (for testing)
@returns {Promise<object|null>} The updated participant record, or null if not found
@throws {Error} If email already exists or another error occurs
```

## C:\Users\Ken\Desktop\back-stage\src\db\participants\updateParticipantHandler.js

```
@file src/db/participants/updateParticipantHandler.js
@description Handler for updating a participant.
```

```
Handles request to update a participant
@param {object} req - Express request object
@param {object} req.params - Request parameters
@param {string} req.params.id - Participant ID
@param {object} req.body - Request body
@param {string} [req.body.name] - Updated name
@param {string} [req.body.email] - Updated email
@param {string} [req.body.password] - Updated password (will be hashed)
@param {object} req.user - Authenticated user information
@param {number} req.user.participantId - ID of the authenticated participant
@param {object} res - Express response object
@returns {Promise<void>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\preferences\createGroupPreference.js

```
@file src/db/preferences/createGroupPreference.js
@description Creates or updates a group preference in the database.
```

```
Creates or updates a group preference
@param {number} groupId - The ID of the group
@param {number} preferenceTypeId - The ID of the preference type
@param {object} value - The JSON value for the preference
@param {object} [customPool=pool] - Database connection pool (for testing)
@returns {Promise<object>} The newly created or updated group preference
@throws {Error} If an error occurs during creation/update
```

## C:\Users\Ken\Desktop\back-stage\src\db\preferences\createParticipantPreference.js

```
@file src/db/preferences/createParticipantPreference.js
@description Creates or updates a participant preference in the database.
```

```
Creates or updates a participant preference
@param {number} participantId - The ID of the participant
@param {number} preferenceTypeId - The ID of the preference type
@param {object} value - The JSON value for the preference
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<object>} The newly created or updated participant preference
@throws {Error} If an error occurs during creation/update
```

## C:\Users\Ken\Desktop\back-stage\src\db\preferences\createSitePreference.js

```
@file src/db/preferences/createSitePreference.js
@description Creates or updates a site-wide preference in the database.
```

```
Creates or updates a site-wide preference
@param {number} preferenceTypeId - The ID of the preference type
@param {object} value - The JSON value for the preference
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<object>} The newly created or updated site preference
@throws {Error} If an error occurs during creation/update
```

## C:\Users\Ken\Desktop\back-stage\src\db\preferences\getAllPreferenceTypes.js

```
@file src/db/preferences/getAllPreferenceTypes.js
@description Retrieves all preference types from the database.
```

```
Retrieves all preference types
@param {object} [customPool=pool] - Database connection pool (for testing)
@returns {Promise<Array>} Array of preference types
@throws {Error} If an error occurs during retrieval
```

## C:\Users\Ken\Desktop\back-stage\src\db\preferences\getPreferenceTypeByName.js

```
@file src/db/preferences/getPreferenceTypeByName.js
@description Retrieves a preference type by its name from the database.
```

```
Retrieves a preference type by its name
@param {string} name - The unique name of the preference type
@param {object|string} [customPoolOrSchema=defaultPool] - Database connection pool or schema name
@returns {Promise<object|null>} The preference type or null if not found
@throws {Error} If an error occurs during retrieval
```

## C:\Users\Ken\Desktop\back-stage\src\db\preferences\getPreferenceWithFallback.js

```
@file src/db/preferences/getPreferenceWithFallback.js
@description Retrieves a preference with fallback hierarchy (participant -> group -> site -> default).
```

```
Retrieves a preference with fallback hierarchy
@param {string} preferenceName - The name of the preference type
@param {object} options - Options for preference retrieval
@param {number} [options.participantId] - The ID of the participant (optional)
@param {number} [options.groupId] - The ID of the group (optional)
@param {string} [options.schema='public'] - The database schema to use
@param {object} [options.customPool=null] - Database connection pool (for testing)
@returns {Promise<object>} The preference value with source information
@throws {Error} If an error occurs during retrieval or preference type doesn't exist
```

## C:\Users\Ken\Desktop\back-stage\src\db\preferences\index.js

```
Preferences database operations
@module db/preferences
```

## C:\Users\Ken\Desktop\back-stage\src\middleware\auth.js

```
Express middleware that:
1. Reads a JWT from Authorization header or HttpOnly cookie
2. Verifies the JWT
3. Attaches the decoded payload to req.user
4. Returns 401 if missing or invalid
```

## C:\Users\Ken\Desktop\back-stage\src\middleware\authWithSchema.js

```
Combined middleware for authentication and setting client schema
This middleware combines requireAuth and setClientSchema for convenience
```

```
Applies both authentication and client schema setting middleware
@param {Object} req - Express request object
@param {Object} res - Express response object
@param {Function} next - Express next middleware function
```

## C:\Users\Ken\Desktop\back-stage\src\middleware\setClientSchema.js

```
Middleware to set the client schema for each request
This middleware extracts the client schema from:
1. Subdomain (dev.example.com, first-congregational.example.com, etc.)
2. JWT payload (req.user.clientSchema)
3. Default schema ('dev')
```

```
Extract the subdomain from the hostname
@param {string} hostname - The hostname from the request
@returns {string|null} - The subdomain or null if no subdomain
```

```
Sets the client schema on the request object
Priority order:
1. Subdomain (dev.example.com, first-congregational.example.com, etc.)
2. JWT payload (req.user.clientSchema)
3. Default schema from configuration
@param {Object} req - Express request object
@param {Object} res - Express response object
@param {Function} next - Express next middleware function
```

## C:\Users\Ken\Desktop\back-stage\src\routes\conversations.js

```
@file src/routes/conversations.js
@description Routes for handling conversations between participants and LLMs
```

```
POST /api/conversations/:conversationId/turns
Creates a new turn in a conversation and generates an LLM response
Requires authentication
```

```
GET /api/conversations/:conversationId/turns
Gets all turns for a conversation
Requires authentication
```

## C:\Users\Ken\Desktop\back-stage\src\routes\groups.js

```
@file src/routes/groups.js
@description Creates routes for all the group functions.
```

## C:\Users\Ken\Desktop\back-stage\src\routes\grpConAvatars.js

```
POST   /api/grp-con-avatars
body: { conversationId, avatarId }
```

```
GET    /api/grp-con-avatars/by-conversation/:conversationId
```

```
GET    /api/grp-con-avatars/by-avatar/:avatarId
```

```
DELETE /api/grp-con-avatars/:conversationId/:avatarId
```

## C:\Users\Ken\Desktop\back-stage\src\routes\grpConAvatarTurnRelationships.js

```
@file HTTP routes for managing avatar‐turn relationships in group conversations.
```

```
POST   /api/avatar-turn-relationships/
Create a new turn-relationship.
Expects JSON body: { turnId, targetTurnId, relationshipTypeId }
```

```
GET    /api/avatar-turn-relationships/:id
Fetch a single relationship by its ID.
```

```
GET    /api/avatar-turn-relationships/by-turn/:turnId
List all relationships originating from a given turn.
```

```
PUT    /api/avatar-turn-relationships/:id
Update the relationship type of an existing relationship.
Expects JSON body: { newTypeId }
```

```
DELETE /api/avatar-turn-relationships/:id
Remove a relationship by its ID.
```

## C:\Users\Ken\Desktop\back-stage\src\routes\grpConAvatarTurns.js

```
@file src/routes/avatarTurns.js
@description HTTP routes for managing avatar‐turns in group conversations.
```

```
POST /api/avatar-turns
Create a new avatar-turn.
Expects JSON body: { conversationId, avatarId, turnIndex, contentText, contentVector, turnKindId }
If contentVector is not provided, it will be generated from contentText
```

```
POST /api/avatar-turns/comment
Create a new comment on an existing turn.
Expects JSON body: { conversationId, avatarId, parentTurnId, contentText, contentVector }
Automatically calculates the appropriate turnIndex for the comment
```

```
GET /api/avatar-turns/:id
Fetch a single turn by its ID.
```

```
GET /api/avatar-turns/by-conversation/:conversationId
List all turns within a given conversation.
```

```
PUT /api/avatar-turns/:id
Update text and/or vector of an existing turn.
Expects JSON body: { contentText, contentVector }
If contentVector is not provided but contentText is, a new vector will be generated
```

```
DELETE /api/avatar-turns/:id
Remove a turn by its ID.
```

## C:\Users\Ken\Desktop\back-stage\src\routes\grpCons.js

```
POST   /api/grpCons
body: { groupId, name, description, typeId }
```

```
GET    /api/grpCons/:id
```

```
GET    /api/grpCons/by-group/:groupId
query: { typeId } - Optional filter by type (1=conversation, 2=template)
```

```
PUT    /api/grpCons/:id
body: { newName, newDescription, newTypeId }
```

```
DELETE /api/grpCons/:id
```

## C:\Users\Ken\Desktop\back-stage\src\routes\grpConUploads.js

```
Group conversation uploads routes
@module routes/grpConUploads
```

```
Upload a file to a conversation
@name POST /api/grp-con-uploads
@function
@memberof module:routes/grpConUploads
@param {string} req.body.grpConId - The conversation ID
@param {string} req.body.avatarId - The avatar ID (optional, defaults to participant's avatar)
@param {File} req.file - The file to upload
@returns {Object} The created upload record
```

```
Get a specific file by ID
@name GET /api/grp-con-uploads/:id
@function
@memberof module:routes/grpConUploads
@param {string} req.params.id - The upload ID
@returns {Object} The file data
```

```
Get all files for a conversation
@name GET /api/grp-con-uploads/conversation/:grpConId
@function
@memberof module:routes/grpConUploads
@param {string} req.params.grpConId - The conversation ID
@returns {Array} Array of upload records
```

```
Delete a file
@name DELETE /api/grp-con-uploads/:id
@function
@memberof module:routes/grpConUploads
@param {string} req.params.id - The upload ID
@returns {Object} Success message
```

## C:\Users\Ken\Desktop\back-stage\src\routes\me.js

```
Route module for authenticated user info.
*
@module routes/me
```

```
GET /api/me
*
Returns the authenticated user's information including participant details.
Requires a valid JWT or session via requireAuth middleware.
*
@name GetMe
@route {GET} /api/me
@middleware requireAuth
@returns {Object} 200 - User object with participant details
```

## C:\Users\Ken\Desktop\back-stage\src\routes\participantAvatars.js

```
@file src/routes/participantAvatars.js
@description Routes for managing participant-avatar relationships.
```

```
Create a new participant-avatar relationship
POST /api/participant-avatars
```

```
Get a participant-avatar relationship by ID
GET /api/participant-avatars/:id
```

```
Get all avatar relationships for a participant
GET /api/participant-avatars/participant/:participantId
```

```
Get all participant relationships for an avatar
GET /api/participant-avatars/avatar/:avatarId
```

```
Delete a participant-avatar relationship
DELETE /api/participant-avatars/:id
```

## C:\Users\Ken\Desktop\back-stage\src\routes\participantEvents.js

```
@file src/routes/participantEvents.js
@description API routes for participant events
```

```
@route GET /api/participant-events
@description Get all events for the authenticated participant
@access Private
```

```
@route GET /api/participant-events/:id
@description Get a specific participant event by ID
@access Private
```

```
@route GET /api/participant-events/type/:typeId
@description Get all events of a specific type (admin only)
@access Private/Admin
```

```
@route POST /api/participant-events
@description Create a new participant event
@access Private
```

## C:\Users\Ken\Desktop\back-stage\src\routes\participants.js

```
@file src/routes/participants.js
@description Creates routes for all the participant functions.
```

```
POST /api/participants/login
Authenticate a participant and issue a token.
```

```
POST /api/participants/logout
Logout a participant and clear their token.
Requires authentication.
```

```
POST /api/participants
Create a new participant.
Body: { name, email, password }
```

```
GET /api/participants
Retrieve all participants.
```

```
GET /api/participants/:id
Retrieve a single participant by ID.
```

```
PUT /api/participants/:id
Update a participant's data.
Body: { name?, email?, password? }
Note: Avatar preferences are now handled through the preferences system
```

```
DELETE /api/participants/:id
Delete a participant by ID.
```

## C:\Users\Ken\Desktop\back-stage\src\routes\preferences.js

```
@file src/routes/preferences.js
@description API routes for managing preferences
```

```
@route GET /api/preferences/types
@description Get all preference types
@access Private
```

```
@route GET /api/preferences/participant/by-name/:preferenceName
@description Get a participant preference by name
@access Private
```

```
@route GET /api/preferences/:preferenceName
@description Get a preference with fallback hierarchy
@access Private
```

```
@route POST /api/preferences/participant
@description Create or update a participant preference
@access Private
```

```
@route POST /api/preferences/group
@description Create or update a group preference
@access Private (admin only)
```

```
@route POST /api/preferences/site
@description Create or update a site preference
@access Private (super admin only)
```

## C:\Users\Ken\Desktop\back-stage\src\services\authService.js

```
@file src/services/authService.js
@description reusable JWT logic
```

```
creates a JWT token
@param payload
```

```
verifies a JWT token
@param token
```

## C:\Users\Ken\Desktop\back-stage\src\services\embeddingService.js

```
@file src/services/embeddingService.js
@description Service for generating embeddings (vectors) from text content using Anthropic API,
preprocessing prompts, and finding similar texts based on embedding similarity
```

```
Initialize the embedding service with the provided configuration or environment variable
@param {Object} config - The LLM configuration (optional)
@param {Object} options - Additional options
@param {string} options.schema - The schema to use for database operations (optional)
@returns {boolean} Whether the initialization was successful
```

```
Generate an embedding vector for the given text
@param {string} text - The text to generate an embedding for
@param {Object} config - The LLM configuration (optional)
@param {Object} options - Additional options
@param {string} options.schema - The schema to use for database operations (optional)
@returns {Promise<number[]>} The embedding vector
```

```
Normalize a vector to ensure it has the correct dimension
@param {number[]} arr - The vector to normalize
@returns {number[]} The normalized vector
```

```
Generate a deterministic embedding vector based on the text content
This is a fallback method when the API embedding generation fails
@param {string} text - The text to generate an embedding for
@returns {number[]} The deterministic embedding vector
```

```
Check if a value is a valid embedding vector
@param {any} vec - The value to check
@returns {boolean} True if the value is a valid embedding vector
```

```
Calculate cosine similarity between two vectors
@param {number[]} vec1 - First vector
@param {number[]} vec2 - Second vector
@returns {number} Cosine similarity (between -1 and 1, higher is more similar)
```

```
Preprocess a prompt to extract key concepts and generate query variants
@param {string} prompt - The original prompt
@returns {string[]} Array of query variants
```

```
Find similar texts based on embedding similarity
@param {number[]} queryEmbedding - The embedding vector to compare against
@param {Array<{text: string, embedding: number[]}>} embeddingDatabase - Array of objects containing text and embedding
@param {Object} options - Optional parameters
@param {number} options.threshold - Similarity threshold (default: SIMILARITY_THRESHOLD)
@param {number} options.maxResults - Maximum number of results to return (default: MAX_RESULTS)
@returns {Array<{text: string, similarity: number}>} Array of similar texts with their similarity scores
```

```
Find similar texts using multiple query variants
@param {string} prompt - The original prompt
@param {Array<{text: string, embedding: number[]}>} embeddingDatabase - Array of objects containing text and embedding
@param {Object} options - Optional parameters
@param {Object} options.config - LLM configuration to use for this request (optional)
@param {string} options.schema - The schema to use for database operations (optional)
@returns {Promise<Array<{text: string, similarity: number}>>} Array of similar texts with their similarity scores
```

## C:\Users\Ken\Desktop\back-stage\src\services\llmService.js

```
@file src/services/llmService.js
@description Service for interacting with various LLM providers via their APIs
```

```
Get the LLM ID from preferences using the preference cascade
@param {number} [participantId=null] - The participant ID to get the LLM ID for (optional)
@param {number} [groupId=null] - The group ID to get the LLM ID for (optional)
@returns {Promise<number>} The ID of the preferred LLM
@throws {Error} If no LLM ID is found in the preference cascade
```

```
Get the LLM configuration for a specific LLM ID
@param {number} llmId - The LLM ID to get the configuration for
@param {string} [schema=null] - The schema to use for database operations (optional)
@returns {Promise<Object|null>} The LLM configuration or null if not found
```

```
Get the LLM configuration for a specific participant using the preference hierarchy
@param {number} participantId - The participant ID to get the LLM configuration for
@param {string} [schema=null] - The schema to use for database operations (optional)
@returns {Promise<Object|null>} The LLM configuration or null if not found
```

```
Get the default LLM configuration from site preferences
@param {string} [schema=null] - The schema to use for database operations
@returns {Promise<Object>} The default LLM configuration
@throws {Error} If no default LLM configuration is found
```

```
Get a list of available LLMs for a specific site
@param {string} subdomain - The subdomain of the site
@returns {Promise<Array>} Array of available LLMs for the site
```

```
Get the LLM name based on the preference system
@param {number} [participantId=null] - The participant ID to get the LLM name for (optional)
@param {number} [groupId=null] - The group ID to get the LLM name for (optional)
@param {string} [schema=null] - The schema to use for database operations (optional)
@returns {Promise<string>} The name of the LLM or default name ('Anthropic Claude-3-Opus')
```

```
Initialize the LLM service with the provided configuration, participant ID, group ID, or environment variable
@param {Object|number} configOrParticipantId - The LLM configuration or participant ID (optional)
@param {Object} [options={}] - Additional options
@param {number} [options.groupId] - The group ID to use for preference lookup (optional)
@param {string} [options.schema=null] - The schema to use for database operations (optional)
@returns {Promise<boolean>} Whether the initialization was successful
```

```
Handle a request to the Anthropic API
@param {string} prompt - The user's message
@param {Object} config - The LLM configuration
@param {Object} options - Additional options
@returns {Promise<string>} The LLM's response
```

```
Handle a request to the OpenAI Chat Completions API
@param {string} prompt - The user's message
@param {Object} config - The LLM configuration
@param {Object} options - Additional options
@returns {Promise<string>} The LLM's response
```

```
Handle a request to the OpenAI Assistants API (Custom GPTs)
@param {string} prompt - The user's message
@param {Object} config - The LLM configuration
@param {Object} options - Additional options
@returns {Promise<string>} The LLM's response
```

```
Get a response from LLM for the given prompt
@param {string} prompt - The user's message
@param {Object} options - Optional parameters
@param {string} options.systemMessage - Custom system message (optional)
@param {Array<{role: string, content: string}>} options.messages - Array of message objects for conversation history (optional)
@param {number} options.temperature - Controls randomness (0.0-1.0, lower is more deterministic) (optional)
@param {number} options.topP - Controls diversity of responses (0.0-1.0) (optional)
@param {number} options.maxTokens - Maximum number of tokens in the response (optional)
@param {Object} options.config - LLM configuration to use for this request (optional)
@param {string} options.schema - The schema to use for database operations (optional)
@returns {Promise<string>} LLM's response
```

## C:\Users\Ken\Desktop\back-stage\src\services\supabaseService.js

```
Supabase service for file storage operations
@module services/supabaseService
```

```
Upload a file to Supabase Storage
@param {Buffer} fileBuffer - The file buffer to upload
@param {string} fileName - The name of the file
@param {string} mimeType - The MIME type of the file
@param {string} clientSchema - The client schema (used for bucket organization)
@param {string} conversationId - The conversation ID
@returns {Promise<Object>} - The upload result with file path
```

```
Get a file from Supabase Storage
@param {string} filePath - The path of the file in Supabase Storage
@param {string} clientSchema - The client schema (used as bucket name)
@returns {Promise<Object>} - The file data
```

```
Delete a file from Supabase Storage
@param {string} filePath - The path of the file in Supabase Storage
@param {string} clientSchema - The client schema (used as bucket name)
@returns {Promise<boolean>} - True if deletion was successful
```

## C:\Users\Ken\Desktop\back-stage\src\utils\clientSchema.js

```
Utility functions for determining client schema
```

```
Determines the client schema for a participant
Uses the SUBDOMAIN_TO_SCHEMA mapping to determine the schema
based on the participant's organization or other attributes
@param {Object} participant - The participant object
@param {Object} [options] - Additional options
@param {boolean} [options.isLocalhost] - Whether the request is from localhost
@returns {string} - The schema name for the participant
```

```
Gets a list of all client schemas
This is used for operations that need to be performed across all schemas
@returns {Promise<string[]>} - A promise that resolves to an array of schema names
```

## C:\Users\Ken\Desktop\back-stage\test\comments.test.js

```
@file test/comments.test.js
@description Tests for the comments feature
```

## C:\Users\Ken\Desktop\back-stage\test\grpConAvatars.test.js

```
Helper to clean up all avatars for a conversation + drop the conversation
```

## C:\Users\Ken\Desktop\back-stage\test\grpConAvatarTurnRelationships.test.js

```
@file tests/grpConAvatarTurnRelationships.test.js
@description Integration tests for avatar turn relationship operations.
```

```
Temporary storage for created IDs during tests.
@type {{ convId: number, turnA: object, turnB: object }}
```

```
Helper: cleans up test data (relationships, turns, conversation).
@returns {Promise<void>}
```

## C:\Users\Ken\Desktop\back-stage\test\participant.integration.test.js

```
Test suite for participant database operations using real database
Uses pre-existing test group (ID: 1) and test participant (ID: 1)
All other test data will be created and cleaned up during tests
```

```
Array to track IDs of participants created during tests for cleanup
@type {number[]}
```

```
Test email prefix to identify test participants
@type {string}
```

```
Run before all tests to ensure database connection
```

```
Clean up all test participants created during tests
```

```
Tests for the createParticipant function
```

```
Tests successful creation of a participant
```

```
Tests error handling when email already exists
```

```
Tests for the getParticipantById function
```

```
Tests successful retrieval of a participant by ID
```

```
Tests behavior when participant is not found
```

```
Tests that the predefined test participant exists
```

```
Tests for the getParticipantByEmail function
```

```
Tests successful retrieval of a participant by email
```

```
Tests behavior when email is not found
```

```
Tests for the getAllParticipants function
```

```
Tests successful retrieval of all participants
```

```
Tests for the updateParticipant function
```

```
Tests successful update of a participant
```

```
Tests behavior when participant is not found
```

```
Tests error handling when email already exists
```

```
Tests for the deleteParticipant function
```

```
Tests successful deletion of a participant
```

```
Tests behavior when participant is not found
```

```
Tests for the getParticipantsByGroup function
```

```
Tests retrieval of participants in a group
Using the predefined test group (ID: 1)
```

```
Tests behavior for a non-existent group
```

## C:\Users\Ken\Desktop\back-stage\test\participantEvents.test.js

```
Helper to clean up test events
```

