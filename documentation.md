# Project Documentation

## C:\Users\Ken\Desktop\back-stage\cli.js

```
Create a new participant, but handle 409 conflict with a friendly message.
```

## C:\Users\Ken\Desktop\back-stage\server.js

```
Main entry point: start the Express server.
Assumes `app` is exported as default from app.js.
```

```
Boot the HTTP server on the specified port.
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

## C:\Users\Ken\Desktop\back-stage\scripts\fix-participant-events-sequence.js

```
Script to fix the participant_events sequence
This script executes the SQL in sql-scripts/fix-participant-events-sequence.sql
to ensure the id column in participant_events has a properly attached sequence
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

## C:\Users\Ken\Desktop\back-stage\src\db\groups\getGroupsByParticipant.js

```
@file src/db/groups/getGroupsByParticipant.js
@description Retrieves all groups that a specific participant belongs to.
```

```
The database connection pool
```

```
Retrieves all groups that a specific participant belongs to
@param {number} participantId - The ID of the participant
@param {object} [pool=defaultPool] - Database connection pool (for testing)
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

## C:\Users\Ken\Desktop\back-stage\src\db\grpConAvatarTurns\getGrpConAvatarTurnsByConversation.js

```
Parse a vector string from the database into an array of numbers
@param {string} vectorStr - The vector string from the database (e.g., "[0.1,0.2,0.3]")
@returns {number[]} The parsed vector as an array of numbers
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpCons\createGrpCon.js

```
Creates a new conversation under a group.
@param {number} groupId - The ID of the group.
@param {string} name - The conversation name.
@param {string} description - The conversation description.
@returns {Promise<{id: number, group_id: number, name: string, description: string, created_at: string}>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpCons\deleteGrpCon.js

```
Deletes a conversation by its ID.
@param {number} id - The conversation ID.
@returns {Promise<boolean>} True if deleted, false otherwise.
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpCons\getGrpConById.js

```
Retrieves a conversation by its ID.
@param {number} id - The conversation ID.
@returns {Promise<{id: number, group_id: number, name: string, description: string, created_at: string}|null>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpCons\getGrpConsByGroup.js

```
Retrieves conversations for a given group, ordered by creation date (newest first) and limited to 50.
@param {number} groupId - The group ID.
@returns {Promise<Array<{id: number, group_id: number, name: string, description: string, created_at: string}>>}
```

## C:\Users\Ken\Desktop\back-stage\src\db\grpCons\updateGrpCon.js

```
Updates a conversation's name and description.
@param {number} id - The conversation ID.
@param {string} newName - The new conversation name.
@param {string} newDescription - The new conversation description.
@returns {Promise<{id: number, group_id: number, name: string, description: string, created_at: string}|null>}
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
@param {object} [customPool=pool] - Database connection pool (for testing)
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
@param {object} [customPool=pool] - Database connection pool (for testing)
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
@param {object} [customPool=pool] - Database connection pool (for testing)
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
@param {object} [customPool=pool] - Database connection pool (for testing)
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
@param {object} [customPool=pool] - Database connection pool (for testing)
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
@param {object} [customPool=pool] - Database connection pool (for testing)
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
@param {object} [customPool=pool] - Database connection pool (for testing)
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
@param {object} [options.customPool=pool] - Database connection pool (for testing)
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
Expects JSON body: { conversationId, avatarId, turnIndex, contentText, contentVector }
If contentVector is not provided, it will be generated from contentText
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
body: { groupId, name, description }
```

```
GET    /api/grpCons/:id
```

```
GET    /api/grpCons/by-group/:groupId
```

```
PUT    /api/grpCons/:id
body: { newName, newDescription }
```

```
DELETE /api/grpCons/:id
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
@returns {boolean} Whether the initialization was successful
```

```
Generate an embedding vector for the given text
@param {string} text - The text to generate an embedding for
@param {Object} config - The LLM configuration (optional)
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
@returns {Promise<Object|null>} The LLM configuration or null if not found
```

```
Get the LLM configuration for a specific participant using the preference hierarchy
@param {number} participantId - The participant ID to get the LLM configuration for
@returns {Promise<Object|null>} The LLM configuration or null if not found
```

```
Get the default LLM configuration from site preferences
@returns {Promise<Object>} The default LLM configuration
@throws {Error} If no default LLM configuration is found
```

```
Get the LLM name based on the preference system
@param {number} [participantId=null] - The participant ID to get the LLM name for (optional)
@param {number} [groupId=null] - The group ID to get the LLM name for (optional)
@returns {Promise<string>} The name of the LLM or default name ('Anthropic Claude-3-Opus')
```

```
Initialize the LLM service with the provided configuration, participant ID, group ID, or environment variable
@param {Object|number} configOrParticipantId - The LLM configuration or participant ID (optional)
@param {Object} [options={}] - Additional options
@param {number} [options.groupId] - The group ID to use for preference lookup (optional)
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
@returns {Promise<string>} LLM's response
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

