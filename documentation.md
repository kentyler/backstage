# Project Documentation

## C:\Users\Ken\Desktop\back-stage\scripts\check-env.js

```
Script to check the environment variables needed for database connection
Run this script to verify your .env file is configured properly
```

## C:\Users\Ken\Desktop\back-stage\scripts\test-db-connection.js

```
Simple script to test database connectivity
Run this script to verify that your database configuration works
```

```
Test database connection and basic queries
```

## C:\Users\Ken\Desktop\back-stage\src\db\connection.js

```
Database connection module
Provides a PostgreSQL connection pool for the application
```

## C:\Users\Ken\Desktop\back-stage\src\db\group\createGroup.js

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

## C:\Users\Ken\Desktop\back-stage\src\db\group\deleteGroup.js

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

## C:\Users\Ken\Desktop\back-stage\src\db\group\getAllGroups.js

```
@file src/db/group/getAllGroups.js
@description Retrieves all group records from the database.
```

```
Retrieves all groups from the database.
*
@returns {Promise<Array<{id: number, name: string, created_at: string}>>} Array of group records.
```

## C:\Users\Ken\Desktop\back-stage\src\db\group\getGroupById.js

```
@file src/db/group/getGroupById.js
@description Retrieves a group record from the database by its ID.
```

```
Retrieves a single group by its ID.
*
@param {number} id - The ID of the group to retrieve.
@returns {Promise<{id: number, name: string, created_at: string}|null>} The group record, or null if not found.
```

## C:\Users\Ken\Desktop\back-stage\src\db\group\getGroupByName.js

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

## C:\Users\Ken\Desktop\back-stage\src\db\group\updateGroup.js

```
@file src/db/group/updateGroup.js
@description Updates a group's name in the database.
```

```
Updates the name of an existing group.
*
@param {number} groupId - The ID of the group to update.
@param {string} newName - The new name for the group.
@returns {Promise<{id: number, name: string, created_at: string}|null>} The updated group record, or null if not found.
```

## C:\Users\Ken\Desktop\back-stage\src\db\groupConversation\index.js

```
@file src/db/groupConversation/index.js
@description CRUD operations for group_conversations.
```

```
Creates a new conversation under a group.
*
@param {number} groupId - The ID of the group.
@param {string} name - The conversation name.
@param {string} description - The conversation description.
@returns {Promise<{id: number, group_id: number, name: string, description: string, created_at: string}>}
```

```
Retrieves a conversation by its ID.
*
@param {number} id - The conversation ID.
@returns {Promise<{id: number, group_id: number, name: string, description: string, created_at: string}|null>}
```

```
Retrieves all conversations for a given group.
*
@param {number} groupId - The group ID.
@returns {Promise<Array<{id: number, group_id: number, name: string, description: string, created_at: string}>>}
```

```
Updates a conversation's name and description.
*
@param {number} id - The conversation ID.
@param {string} newName - The new conversation name.
@param {string} newDescription - The new conversation description.
@returns {Promise<{id: number, group_id: number, name: string, description: string, created_at: string}|null>}
```

```
Deletes a conversation by its ID.
*
@param {number} id - The conversation ID.
@returns {Promise<boolean>} True if deleted, false otherwise.
```

## C:\Users\Ken\Desktop\back-stage\src\db\groupConversationAvatarTurnRelationships\index.js

```
@file src/db/groupConversationAvatarTurnRelationships/index.js
@description CRUD operations for creating and managing relationships between avatar turns in group conversations.
```

```
Creates a directed relationship between two avatar turns.
Always from the newer turn back to the earlier turn.
@param {number} turnId - The ID of the later/responding turn.
@param {number} targetTurnId - The ID of the earlier/prompt turn.
@param {number} [relationshipTypeId=1] - The lookup ID for the relationship type (e.g. "response_to").
@returns {Promise<{id: number, turn_id: number, target_turn_id: number, turn_relationship_type_id: number, created_at: string}>}
```

```
Fetches a relationship row by its ID.
@param {number} id - The relationship record ID.
@returns {Promise<{id: number, turn_id: number, target_turn_id: number, turn_relationship_type_id: number, created_at: string} | null>}
```

```
Lists all relationships originating from a given turn.
@param {number} turnId - The ID of the originating turn.
@returns {Promise<Array<{id: number, turn_id: number, target_turn_id: number, turn_relationship_type_id: number, created_at: string}>>}
```

```
Updates the relationship type of an existing relationship.
@param {number} id - The relationship record ID.
@param {number} newTypeId - The new relationship type lookup ID.
@returns {Promise<{id: number, turn_id: number, target_turn_id: number, turn_relationship_type_id: number, created_at: string} | null>}
```

```
Deletes a relationship by its ID.
@param {number} id - The relationship record ID.
@returns {Promise<boolean>} True if the record was deleted.
```

## C:\Users\Ken\Desktop\back-stage\src\db\groupConversationAvatarTurns\index.js

```
@file src/db/groupConversationAvatarTurns/index.js
@description CRUD operations for avatar turns in group conversations.
```

```
Ensures a JS number[] matches the required VECTOR_DIM by padding with zeros or truncating.
@param {number[]} arr
@returns {number[]}
```

```
Converts a JS number[] into a PostgreSQL vector literal string.
E.g. [0.1,0.2,...] → "[0.1,0.2,...]"
@param {number[]} arr
@returns {string}
```

```
Creates a new avatar turn in a group conversation.
*
@param {number} conversationId - The ID of the group conversation.
@param {number} avatarId - The ID of the avatar.
@param {number} turnIndex - The index/order of the turn.
@param {string} contentText - The text content of the turn.
@param {Array<number>} contentVector - The embedding vector for the content.
@returns {Promise<{id: number, group_conversation_id: number, avatar_id: number, turn_index: number, content_text: string, content_vector: Array<number>, created_at: string}>}
```

```
Retrieves a single avatar turn by its ID.
*
@param {number} id - The ID of the avatar turn.
@returns {Promise<{id: number, group_conversation_id: number, avatar_id: number, turn_index: number, content_text: string, content_vector: Array<number>, created_at: string}|null>}
```

```
Retrieves all avatar turns for a given group conversation, ordered by turn_index.
*
@param {number} conversationId - The group conversation ID.
@returns {Promise<Array<{id: number, group_conversation_id: number, avatar_id: number, turn_index: number, content_text: string, content_vector: Array<number>, created_at: string}>>}
```

```
Updates content_text and/or content_vector of an existing avatar turn.
*
@param {number} id - The ID of the avatar turn.
@param {string} newText - The new text content for the turn.
@param {Array<number>} newVector - The new embedding vector for the content.
@returns {Promise<{id: number, group_conversation_id: number, avatar_id: number, turn_index: number, content_text: string, content_vector: Array<number>, created_at: string}|null>}
```

```
Deletes an avatar turn by its ID.
*
@param {number} id - The ID of the avatar turn.
@returns {Promise<boolean>} True if a turn was deleted, false otherwise.
```

## C:\Users\Ken\Desktop\back-stage\src\db\participant\createParticipant.js

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

## C:\Users\Ken\Desktop\back-stage\src\db\participant\createParticipantHandler.js

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

## C:\Users\Ken\Desktop\back-stage\src\db\participant\deleteParticipant.js

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

## C:\Users\Ken\Desktop\back-stage\src\db\participant\deleteParticipantHandler.js

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

## C:\Users\Ken\Desktop\back-stage\src\db\participant\getAllParticipants.js

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

## C:\Users\Ken\Desktop\back-stage\src\db\participant\getAllParticipantsHandler.js

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

## C:\Users\Ken\Desktop\back-stage\src\db\participant\getParticipantByEmail.js

```
@file src/db/participant/getParticipantByEmail.js
@description Retrieves a participant record from the database by email address.
```

```
The database connection pool
```

```
Retrieves a participant by their email address
@param {string} email - The email of the participant to retrieve
@param {object} [pool=defaultPool] - Database connection pool (for testing)
@returns {Promise<object|null>} The participant record, or null if not found
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\src\db\participant\getParticipantById.js

```
@file src/db/participant/getParticipantById.js
@description Retrieves a participant record from the database by its ID.
```

```
The database connection pool
```

```
Retrieves a participant by their ID
@param {number} id - The ID of the participant to retrieve
@param {object} [pool=defaultPool] - Database connection pool (for testing)
@returns {Promise<object|null>} The participant record, or null if not found
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\src\db\participant\getParticipantByIdHandler.js

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

## C:\Users\Ken\Desktop\back-stage\src\db\participant\getParticipantsByGroup.js

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

## C:\Users\Ken\Desktop\back-stage\src\db\participant\getParticipantsByGroupHandler.js

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

## C:\Users\Ken\Desktop\back-stage\src\db\participant\index.js

```
@file src/db/participant/index.js
@description Exports all participant-related database operations.
```

## C:\Users\Ken\Desktop\back-stage\src\db\participant\LogInHandler.js

```
@file src/api/participants/loginHandler.js
@description Handler for participant authentication.
```

```
Handles participant login requests
@param {object} req - Express request object
@param {object} req.body - Request body
@param {string} req.body.email - Participant email
@param {string} req.body.password - Participant password
@param {object} res - Express response object
@returns {Promise<void>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\participant\updateParticipant.js

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
@param {number} [updates.current_avatar_id] - Updated avatar ID
@param {object} [pool=defaultPool] - Database connection pool (for testing)
@returns {Promise<object|null>} The updated participant record, or null if not found
@throws {Error} If email already exists or another error occurs
```

## C:\Users\Ken\Desktop\back-stage\src\db\participant\updateParticipantHandler.js

```
@file src/api/participants/updateParticipantHandler.js
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
@param {number} [req.body.current_avatar_id] - Updated avatar ID
@param {object} res - Express response object
@returns {Promise<void>}
```

## C:\Users\Ken\Desktop\back-stage\src\routes\participants.js

```
@file src/routes/participants.js
@description Express router for participant-related endpoints.
```

```
Express router for participant endpoints
@type {express.Router}
```

## C:\Users\Ken\Desktop\back-stage\test\groupConversationAvatarTurnRelationships.test.js

```
@file tests/groupConversationAvatarTurnRelationships.test.js
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

