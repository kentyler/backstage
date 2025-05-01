# Project Documentation

## C:\Users\Ken\Desktop\back-stage\cli.js

```
Create a new participant, but handle 409 conflict with a friendly message.
```

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

## C:\Users\Ken\Desktop\back-stage\src\controllers\participants\loginHandler.js

```
@file src/controllers/participants/loginHandler.js
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

## C:\Users\Ken\Desktop\back-stage\src\db\connection.js

```
Database connection module
Provides a PostgreSQL connection pool for the application
```

## C:\Users\Ken\Desktop\back-stage\src\db\groupConversationAvatars\createGroupConversationAvatar.js

```
@file src/db/groupConversationAvatars/createGroupConversationAvatar.js
@description Adds an avatar to a group conversation.
```

```
Inserts a new row into group_conversation_avatars.
*
@param {number} conversationId
@param {number} avatarId
@returns {Promise<{group_conversation_id: number, avatar_id: number, added_at: string}>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\groupConversationAvatars\deleteGroupConversationAvatar.js

```
@file src/db/groupConversationAvatars/deleteGroupConversationAvatar.js
@description Removes an avatar from a conversation.
```

```
Deletes the link between an avatar and a conversation.
*
@param {number} conversationId
@param {number} avatarId
@returns {Promise<boolean>} true if deleted, false otherwise
```

## C:\Users\Ken\Desktop\back-stage\src\db\groupConversationAvatars\getGroupConversationAvatarsByConversation.js

```
@file src/db/groupConversationAvatars/getAvatarsByConversation.js
@description Lists all avatars in a given conversation.
```

```
Fetches avatar entries for one conversation.
*
@param {number} conversationId
@returns {Promise<Array<{avatar_id: number, added_at: string}>>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\groupConversationAvatars\getGroupConversationsByAvatar.js

```
@file src/db/groupConversationAvatars/getConversationsByAvatar.js
@description Lists all conversations that include a given avatar.
```

```
Fetches conversation entries for one avatar.
*
@param {number} avatarId
@returns {Promise<Array<{group_conversation_id: number, added_at: string}>>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\groupConversationAvatarTurnRelationships\createGroupConversationAvatarTurnRelationship.js

```
Creates a directed relationship between two avatar turns.
@param {number} turnId
@param {number} targetTurnId
@param {number} [relationshipTypeId=1]
@returns {Promise<object>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\groupConversationAvatarTurnRelationships\deleteGroupConversationAvatarTurnRelationship.js

```
Deletes a relationship by its ID.
@param {number} id
@returns {Promise<boolean>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\groupConversationAvatarTurnRelationships\getGroupConversationAvatarTurnRelationshipById.js

```
Fetches a relationship by its ID.
@param {number} id
@returns {Promise<object|null>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\groupConversationAvatarTurnRelationships\getGroupConversationAvatarTurnRelationshipsByTurn.js

```
Lists all relationships originating from a turn.
@param {number} turnId
@returns {Promise<object[]>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\groupConversationAvatarTurnRelationships\updateGroupConversationAvatarTurnRelationship.js

```
Updates the relationship type of an existing relationship.
@param {number} id
@param {number} newTypeId
@returns {Promise<object|null>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\groupConversations\createGroupConversation.js

```
Creates a new conversation under a group.
@param {number} groupId - The ID of the group.
@param {string} name - The conversation name.
@param {string} description - The conversation description.
@returns {Promise<{id: number, group_id: number, name: string, description: string, created_at: string}>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\groupConversations\deleteGroupConversation.js

```
Deletes a conversation by its ID.
@param {number} id - The conversation ID.
@returns {Promise<boolean>} True if deleted, false otherwise.
```

## C:\Users\Ken\Desktop\back-stage\src\db\groupConversations\getGroupConversationById.js

```
Retrieves a conversation by its ID.
@param {number} id - The conversation ID.
@returns {Promise<{id: number, group_id: number, name: string, description: string, created_at: string}|null>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\groupConversations\getGroupConversationsByGroup.js

```
Retrieves all conversations for a given group.
@param {number} groupId - The group ID.
@returns {Promise<Array<{id: number, group_id: number, name: string, description: string, created_at: string}>>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\groupConversations\updateGroupConversation.js

```
Updates a conversation's name and description.
@param {number} id - The conversation ID.
@param {string} newName - The new conversation name.
@param {string} newDescription - The new conversation description.
@returns {Promise<{id: number, group_id: number, name: string, description: string, created_at: string}|null>}
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

## C:\Users\Ken\Desktop\back-stage\src\db\groups\updateGroup.js

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
The database connection pool
```

```
Retrieves a participant by their email address
@param {string} email - The email of the participant to retrieve
@param {object} [pool=defaultPool] - Database connection pool (for testing)
@returns {Promise<object|null>} The participant record, or null if not found
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\src\db\participants\getParticipantById.js

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
@param {number} [updates.current_avatar_id] - Updated avatar ID
@param {object} [pool=defaultPool] - Database connection pool (for testing)
@returns {Promise<object|null>} The updated participant record, or null if not found
@throws {Error} If email already exists or another error occurs
```

## C:\Users\Ken\Desktop\back-stage\src\db\participants\updateParticipantHandler.js

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

## C:\Users\Ken\Desktop\back-stage\src\middleware\auth.js

```
Express middleware that:
1. Looks for an Authorization: Bearer <token> header
2. Verifies the JWT
3. Attaches the decoded payload to req.user
4. Returns 401 if missing or invalid
```

## C:\Users\Ken\Desktop\back-stage\src\routes\groupConversationAvatars.js

```
POST   /api/group-conversation-avatars
body: { conversationId, avatarId }
```

```
GET    /api/group-conversation-avatars/by-conversation/:conversationId
```

```
GET    /api/group-conversation-avatars/by-avatar/:avatarId
```

```
DELETE /api/group-conversation-avatars/:conversationId/:avatarId
```

## C:\Users\Ken\Desktop\back-stage\src\routes\groupConversationAvatarTurnRelationships.js

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

## C:\Users\Ken\Desktop\back-stage\src\routes\groupConversationAvatarTurns.js

```
@file src/routes/avatarTurns.js
@description HTTP routes for managing avatar‐turns in group conversations.
```

```
POST /api/avatar-turns
Create a new avatar-turn.
Expects JSON body: { conversationId, avatarId, turnIndex, contentText, contentVector }
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
```

```
DELETE /api/avatar-turns/:id
Remove a turn by its ID.
```

## C:\Users\Ken\Desktop\back-stage\src\routes\groupConversations.js

```
POST   /api/group-conversations
body: { groupId, name, description }
```

```
GET    /api/group-conversations/:id
```

```
GET    /api/group-conversations/by-group/:groupId
```

```
PUT    /api/group-conversations/:id
body: { newName, newDescription }
```

```
DELETE /api/group-conversations/:id
```

## C:\Users\Ken\Desktop\back-stage\src\routes\groups.js

```
@file src/routes/groups.js
@description Creates routes for all the group functions.
```

## C:\Users\Ken\Desktop\back-stage\src\routes\participants.js

```
@file src/routes/participants.js
@description Creates routes for all the participant functions.
```

```
POST   /api/participants
body: { name, email, password }
```

```
GET    /api/participants
```

```
GET    /api/participants/:id
```

```
PUT    /api/participants/:id
body: { name?, email?, password?, current_avatar_id? }
```

```
DELETE /api/participants/:id
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

## C:\Users\Ken\Desktop\back-stage\test\groupConversationAvatars.test.js

```
Helper to clean up all avatars for a conversation + drop the conversation
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

