# Project Documentation

## C:\Users\Ken\Desktop\back-stage\backend\config.js

```
Environment-aware configuration for authentication and CORS
```

## C:\Users\Ken\Desktop\back-stage\backend\config\schema.js

```
Schema configuration settings
```

## C:\Users\Ken\Desktop\back-stage\backend\db\connection.js

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

## C:\Users\Ken\Desktop\back-stage\backend\db\index.js

```
Database module - Main entry point
This file exports all database functions from various modules
in a structured format.
```

## C:\Users\Ken\Desktop\back-stage\backend\db\core\connection.js

```
Database connection module
Provides a PostgreSQL connection pool for the application
Supports schema-based multi-tenancy
```

## C:\Users\Ken\Desktop\back-stage\backend\db\core\getTableInfo.js

```
Database table information utility
Gets information about tables in the current schema
```

```
Gets information about tables in the specified schema
@param {Object} req - Express request object
@returns {Object} Table information including schema, tables, etc.
```

## C:\Users\Ken\Desktop\back-stage\backend\db\core\query.js

```
Database query utility
Provides a schema-aware query function that sets the search_path
based on the request's hostname/subdomain
```

```
Executes a query with the proper schema context based on the request
@param {string} text - SQL query text
@param {Array} params - Query parameters
@param {Object} req - Express request object for schema determination
@returns {Object} Query result with rows and rowCount
```

## C:\Users\Ken\Desktop\back-stage\backend\db\core\schema.js

```
Schema utility functions
Provides functions for schema selection based on hostname/subdomain
```

```
Gets the appropriate schema based on host/subdomain
For localhost, default to 'dev' schema
@param {Object} req - Express request object
@returns {string} Schema name to use
```

## C:\Users\Ken\Desktop\back-stage\backend\db\core\testConnection.js

```
Database connection test function
Tests connection to the database with proper schema selection
```

```
Tests the database connection with schema-aware queries
@param {Object} req - Express request object
@returns {Object} Test results including schema, connection status, etc.
```

## C:\Users\Ken\Desktop\back-stage\backend\db\groups\createGroup.js

```
@file src/db/group/createGroup.js
@description Creates a new group record in the database.
```

```
Creates a new group with the given name.
@param { Pool } pool - The PostgreSQL connection pool.
@param {string} name - The name of the group.
@returns {Promise<{id: number, name: string, created_at: string}>} The newly created group record.
```

## C:\Users\Ken\Desktop\back-stage\backend\db\groups\deleteGroup.js

```
@file src/db/group/deleteGroup.js
@description Deletes a group by its ID.
```

```
Deletes a group from the database.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} groupId - The ID of the group to delete.
@returns {Promise<boolean>} True if a group was deleted, false otherwise.
```

## C:\Users\Ken\Desktop\back-stage\backend\db\groups\getAllGroups.js

```
@file src/db/group/getAllGroups.js
@description Retrieves all group records from the database.
```

```
Retrieves all groups from the database.
@returns {Promise<Array<{id: number, name: string, created_at: string}>>} Array of group records.
@param { Pool } pool - The PostgreSQL connection pool.
```

## C:\Users\Ken\Desktop\back-stage\backend\db\groups\getGroupById.js

```
@file src/db/group/getGroupById.js
@description Retrieves a group record from the database by its ID.
```

```
Retrieves a single group by its ID.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} id - The ID of the group to retrieve.
@returns {Promise<{id: number, name: string, created_at: string}|null>} The group record, or null if not found.
```

## C:\Users\Ken\Desktop\back-stage\backend\db\groups\getGroupByName.js

```
@file src/db/group/getGroupByName.js
@description Retrieves a group record from the database by its name.
```

```
Retrieves a single group by its name.
@param { Pool } pool - The PostgreSQL connection pool.
@param {string} name - The name of the group to retrieve.
@returns {Promise<{id: number, name: string, created_at: string}|null>} The group record, or null if not found.
```

## C:\Users\Ken\Desktop\back-stage\backend\db\groups\getGroupsByParticipant.js

```
@file src/db/groups/getGroupsByParticipant.js
@description Retrieves all groups that a specific participant belongs to.
```

```
Retrieves all groups that a specific participant belongs to
@param {number} participantId - The ID of the participant
@returns {Promise<Array<{id: number, name: string, created_at: string, role: string}>>} Array of group records
@throws {Error} If a database error occurs
@param { Pool } pool - The PostgreSQL connection pool.
```

## C:\Users\Ken\Desktop\back-stage\backend\db\groups\updateGroup.js

```
@file src/db/group/updateGroup.js
@description Updates a group's properties in the database.
```

```
Updates an existing group's properties.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} groupId - The ID of the group to update.
@param {Object} updates - The properties to update.
@param {string} [updates.name] - The new name for the group.
@returns {Promise<{id: number, name: string, created_at: string}|null>} The updated group record, or null if not found.
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConAvatars\createGrpConAvatar.js

```
@file src/db/grpConAvatars/createGrpConAvatar.js
@description Adds an avatar to a group conversation.
```

```
Inserts a new row into grp_con_avatars.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} conversationId
@param {number} avatarId
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<{grp_con_id: number, avatar_id: number, added_at: string}>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConAvatars\deleteGrpConAvatar.js

```
@file src/db/grpConAvatars/deleteGrpConAvatar.js
@description Removes an avatar from a conversation.
```

```
Deletes the link between an avatar and a conversation.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} conversationId
@param {number} avatarId
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<boolean>} true if deleted, false otherwise
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConAvatars\getGrpConAvatarsByConversation.js

```
@file src/db/grpConAvatars/getGrpConAvatarsByConversation.js
@description Lists all avatars in a given conversation.
```

```
Fetches avatar entries for one conversation.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} conversationId
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<Array<{avatar_id: number, added_at: string}>>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConAvatars\getGrpConsByAvatar.js

```
@file src/db/grpConAvatars/getGrpConsByAvatar.js
@description Lists all conversations that include a given avatar.
```

```
Fetches conversation entries for one avatar.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} avatarId
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<Array<{grp_con_id: number, added_at: string}>>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConAvatarTurnRelationships\createGrpConAvatarTurnRelationship.js

```
Creates a directed relationship between two avatar turns.
@param {number} turnId
@param {number} targetTurnId
@param {number} [relationshipTypeId=1]
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConAvatarTurnRelationships\deleteGrpConAvatarTurnRelationship.js

```
Deletes a relationship by its ID.
@param {number} id
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<boolean>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConAvatarTurnRelationships\getGrpConAvatarTurnRelationshipById.js

```
Fetches a relationship by its ID.
@param {number} id
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object|null>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConAvatarTurnRelationships\getGrpConAvatarTurnRelationshipsByTurn.js

```
Lists all relationships originating from a turn.
@param {number} turnId
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object[]>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConAvatarTurnRelationships\updateGrpConAvatarTurnRelationship.js

```
Updates the relationship type of an existing relationship.
@param {number} id
@param {number} newTypeId
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object|null>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConAvatarTurns\createGrpConAvatarTurn.js

```
Creates a new avatar turn in a group conversation
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} conversationId - The ID of the conversation
@param {number} avatarId - The ID of the avatar
@param {number|string} turnIndex - The index of the turn (can be decimal for comments)
@param {string} contentText - The text content of the turn
@param {Array} contentVector - The vector representation of the content
@param {number} [turnKindId=TURN_KIND.REGULAR] - The kind of turn (regular or comment)
@param {number} [messageTypeId=null] - The type of message (1 for user, 2 for LLM)
@param {string|object} schemaOrPool - Either a schema name or a pool object
@returns {Promise<Object>} The created turn
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConAvatarTurns\deleteGrpConAvatarTurn.js

```
Delete a group conversation avatar turn by ID
@param {number} id - The ID of the turn to delete
@param {string|object} schemaOrPool - Either a schema name or a pool object
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<boolean>} True if the turn was deleted, false if not found
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConAvatarTurns\getGrpConAvatarTurnById.js

```
Get a group conversation avatar turn by ID
@param {number} id - The ID of the turn to retrieve
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object|null>} The turn object or null if not found
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConAvatarTurns\getGrpConAvatarTurnsByConversation.js

```
Parse a vector string from the database into an array of numbers
@param { Pool } pool - The PostgreSQL connection pool.
@param {string} vectorStr - The vector string from the database (e.g., "[0.1,0.2,0.3]")
@returns {number[]} The parsed vector as an array of numbers
```

```
Get all avatar turns for a specific conversation
@param {number} conversationId - The ID of the conversation
@param {string|object} [schemaOrPool=null] - Schema name or custom pool
@returns {Promise<Array>} List of avatar turns for the conversation
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConAvatarTurns\updateGrpConAvatarTurn.js

```
Update a group conversation avatar turn
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} id - The ID of the turn to update
@param {string} newText - The new text content
@param {Array<number>} newVector - The new vector content
@returns {Promise<object>} The updated turn
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpCons\createGrpCon.js

```
Creates a new conversation under a group.
@param {number} groupId - The ID of the group.
@param {string} name - The conversation name.
@param {string} description - The conversation description.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} [typeId=1] - The type ID from grp_con_types table (1=conversation, 2=template)
@returns {Promise<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpCons\deleteGrpCon.js

```
Deletes a conversation by its ID.
@param {number} id - The conversation ID.
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<boolean>} True if deleted, false otherwise.
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpCons\getGrpConById.js

```
Retrieves a conversation by its ID.
@param {number} id - The conversation ID.
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}|null>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpCons\getGrpConsByGroup.js

```
Retrieves conversations for a given group, ordered by creation date (newest first) and limited to 50.
@param {number} groupId - The group ID.
@param {Pool} pool - The PostgreSQL connection pool.
@returns {Promise<Array<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}>>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpCons\updateGrpCon.js

```
Updates a conversation's name, description, and optionally its type.
@param {number} id - The conversation ID.
@param {string} newName - The new conversation name.
@param {string} newDescription - The new conversation description.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number|null} [newTypeId=null] - The new type ID from grp_con_types table (1=conversation, 2=template), or null to keep current type
@returns {Promise<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}|null>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConTemplateInstances\createGrpConTemplateInstance.js

```
@file src/db/grpConTemplateInstances/createGrpConTemplateInstance.js
@description Creates a new template instance.
```

```
Creates a new template instance.
@param {number} templateId - The ID of the template
@param {number} groupId - The ID of the group
@param {string} name - The name of the instance (optional, defaults to template name with timestamp)
@param {string} description - The description of the instance (optional)
@param {Pool} pool - The PostgreSQL connection pool
@returns {Promise<{id: number, template_id: number, group_id: number, name: string, description: string, created_at: Date}>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConTemplateInstances\getGrpConTemplateInstancesByTemplate.js

```
@file src/db/grpConTemplateInstances/getGrpConTemplateInstancesByTemplate.js
@description Lists all instances for a given template.
```

```
Fetches template instances for one template.
@param {Pool} pool - The PostgreSQL connection pool.
@param {number} templateId - The ID of the template
@returns {Promise<Array<{id: number, template_id: number, group_id: number, name: string, description: string, created_at: Date}>>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConTemplateTopics\createGrpConTemplateTopic.js

```
@file src/db/grpConTemplateTopics/createGrpConTemplateTopic.js
@description Creates a new topic for a template.
```

```
Inserts a new row into grp_con_template_topics.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} templateId - The ID of the template
@param {string} title - The title of the topic
@param {string} content - The content of the topic (can be empty)
@param {number} topicIndex - The index of the topic for ordering
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<{id: number, template_id: number, title: string, content: string, topic_index: number}>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConTemplateTopics\deleteGrpConTemplateTopic.js

```
@file src/db/grpConTemplateTopics/deleteGrpConTemplateTopic.js
@description Deletes a template topic.
```

```
Deletes a template topic by ID.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} topicId - The ID of the topic to delete
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<{id: number, template_id: number, title: string, content: string, topic_index: number}|null>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConTemplateTopics\getGrpConTemplateTopicById.js

```
@file src/db/grpConTemplateTopics/getGrpConTemplateTopicById.js
@description Retrieves a single template topic by its ID.
```

```
Fetches a single template topic by ID.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} topicId - The ID of the topic to retrieve
@returns {Promise<{id: number, template_id: number, title: string, content: string, topic_index: number}|null>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConTemplateTopics\getGrpConTemplateTopicsByTemplate.js

```
@file src/db/grpConTemplateTopics/getGrpConTemplateTopicsByTemplate.js
@description Lists all topics for a given template, ordered by topic_index.
```

```
Fetches topic entries for one template.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} templateId - The ID of the template
@returns {Promise<Array<{id: number, template_id: number, title: string, content: string, topic_index: number}>>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConTemplateTopics\updateGrpConTemplateTopic.js

```
@file src/db/grpConTemplateTopics/updateGrpConTemplateTopic.js
@description Updates an existing template topic.
```

```
Updates a template topic.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} topicId - The ID of the topic to update
@param {string} title - The updated title
@param {string} content - The updated content
@param {number} topicIndex - The updated topic index
** @returns {Promise<{id: number, template_id: number, title: string, content: string, topic_index: number}|null>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConUploads\createGrpConUpload.js

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
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Object>} - The created upload record
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConUploads\deleteGrpConUpload.js

```
Delete a group conversation upload record
@module db/grpConUploads/deleteGrpConUpload
```

```
Delete a group conversation upload record
@param {number} id - The upload ID
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<boolean>} - True if deletion was successful
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConUploads\getGrpConUploadById.js

```
Get a group conversation upload by ID
@module db/grpConUploads/getGrpConUploadById
```

```
Get a group conversation upload by ID
@param {number} id - The upload ID
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Object|null>} - The upload record or null if not found
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConUploads\getGrpConUploadsByConversation.js

```
Get all uploads for a specific group conversation
@module db/grpConUploads/getGrpConUploadsByConversation
```

```
Get all uploads for a specific group conversation
@param {number} grpConId - The group conversation ID
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Array>} - Array of upload records
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConUploads\index.js

```
Group conversation uploads database operations
@module db/grpConUploads
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConUploadVectors\createGrpConUploadVector.js

```
Create a new group conversation upload vector record
@module db/grpConUploadVectors/createGrpConUploadVector
```

```
Create a new group conversation upload vector record
@param {Object} vectorData - The vector data
@param {number} vectorData.uploadId - The upload ID
@param {number} vectorData.chunkIndex - The chunk index
@param {string} vectorData.contentText - The text content of the chunk
@param {Array<number>} [vectorData.contentVector] - The vector representation of the content (optional)
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Object>} - The created vector record
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConUploadVectors\getGrpConUploadVectorsByUpload.js

```
Get group conversation upload vectors by upload ID
@module db/grpConUploadVectors/getGrpConUploadVectorsByUpload
```

```
Get group conversation upload vectors by upload ID
@param {number} uploadId - The upload ID
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Array<Object>>} - The vector records
```

## C:\Users\Ken\Desktop\back-stage\backend\db\grpConUploadVectors\index.js

```
Group conversation upload vectors database operations
@module db/grpConUploadVectors
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participantAvatars\createParticipantAvatar.js

```
@file src/db/participantAvatars/createParticipantAvatar.js
@description Creates a new participant-avatar relationship.
```

```
Creates a new participant-avatar relationship.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} participantId - The ID of the participant
@param {number} avatarId - The ID of the avatar
@param {number} [createdByParticipantId=null] - The ID of the participant who created this relationship
@returns {Promise<object>} The newly created participant-avatar relationship
@throws {Error} If the operation fails
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participantAvatars\deleteParticipantAvatar.js

```
@file src/db/participantAvatars/deleteParticipantAvatar.js
@description Deletes a participant-avatar relationship.
```

```
Deletes a participant-avatar relationship by ID.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} id - The ID of the participant-avatar relationship to delete
@returns {Promise<object|null>} The deleted relationship or null if not found
@throws {Error} If the operation fails
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participantAvatars\getParticipantAvatarById.js

```
@file src/db/participantAvatars/getParticipantAvatarById.js
@description Retrieves a participant-avatar relationship by ID.
```

```
Retrieves a participant-avatar relationship by ID.
@param {number} id - The ID of the participant-avatar relationship
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object|null>} The participant-avatar relationship or null if not found
@throws {Error} If the operation fails
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participantAvatars\getParticipantAvatarsByAvatar.js

```
@file src/db/participantAvatars/getParticipantAvatarsByAvatar.js
@description Retrieves all participant relationships for a specific avatar.
```

```
Retrieves all participant relationships for a specific avatar.
@param {number} avatarId - The ID of the avatar
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Array<object>>} Array of participant-avatar relationships
@throws {Error} If the operation fails
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participantAvatars\getParticipantAvatarsByParticipant.js

```
@file src/db/participantAvatars/getParticipantAvatarsByParticipant.js
@description Retrieves all avatar relationships for a specific participant.
```

```
Retrieves all avatar relationships for a specific participant.
@param {number} participantId - The ID of the participant
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Array<object>>} Array of participant-avatar relationships
@throws {Error} If the operation fails
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participantAvatars\index.js

```
@file src/db/participantAvatars/index.js
@description Exports all participant-avatar relationship database operations.
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participantEvents\createParticipantEvent.js

```
@file src/db/participantEvents/createParticipantEvent.js
@description Creates a new participant event record in the database.
```

```
Creates a new participant event in the database
@param {number} participantId - The ID of the participant
@param {number} eventTypeId - The ID of the event type
@param {object} [details=null] - Optional JSON details about the event
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object>} The newly created participant event record
@throws {Error} If an error occurs during creation
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participantEvents\getParticipantEventById.js

```
@file src/db/participantEvents/getParticipantEventById.js
@description Retrieves a participant event by its ID.
```

```
Retrieves a participant event by its ID
@param {number} id - The ID of the participant event to retrieve
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object|null>} The participant event record or null if not found
@throws {Error} If an error occurs during retrieval
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participantEvents\getParticipantEventsByParticipant.js

```
@file src/db/participantEvents/getParticipantEventsByParticipant.js
@description Retrieves all events for a specific participant.
```

```
Retrieves all events for a specific participant
@param {number} participantId - The ID of the participant
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Array>} Array of participant event records
@throws {Error} If an error occurs during retrieval
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participantEvents\getParticipantEventsByType.js

```
@file src/db/participantEvents/getParticipantEventsByType.js
@description Retrieves all events of a specific type.
```

```
Retrieves all events of a specific type
@param {number} eventTypeId - The ID of the event type
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Array>} Array of participant event records
@throws {Error} If an error occurs during retrieval
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participantEvents\index.js

```
@file src/db/participantEvents/index.js
@description Export all participant events database functions
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participants\createParticipant.js

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
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object>} The newly created participant record
@throws {Error} If email already exists or another error occurs
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participants\createParticipantHandler.js

```
@file src/api/participants/createParticipantHandler.js
@description Handler for creating a new participant.
```

```
Handles request to create a new participant
@param {object} req.body - Request body
@param {string} req.body.name - Participant name
@param {string} req.body.email - Participant email
@param { Pool } pool - The PostgreSQL connection pool.
@param {string} req.body.password - Participant password (will be hashed)
@param {object} res - Express response object
@returns {Promise<void>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participants\deleteParticipant.js

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
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<boolean>} True if a participant was deleted, false otherwise
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participants\deleteParticipantHandler.js

```
@file src/api/participants/deleteParticipantHandler.js
@description Handler for deleting a participant.
```

```
Handles request to delete a participant
@param {object} req - Express request object
@param {object} req.params - Request parameters
@param {string} req.params.id - Participant ID
@param { Pool } pool - The PostgreSQL connection pool.
@param {object} res - Express response object
@returns {Promise<void>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participants\getAllParticipants.js

```
@file src/db/participant/getAllParticipants.js
@description Retrieves all participant records from the database.
```

```
Retrieves all participants from the database
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object[]>} Array of participant records
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participants\getAllParticipantsHandler.js

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

## C:\Users\Ken\Desktop\back-stage\backend\db\participants\getParticipantByEmail.js

```
@file src/db/participant/getParticipantByEmail.js
@description Retrieves a participant record from the database by email address.
```

```
Retrieves a participant by their email address
@param {string} email - The email of the participant to retrieve
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object|null>} The participant record, or null if not found
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participants\getParticipantByEmailHandler.js

```
@file src/db/participants/getParticipantByEmailHandler.js
@description Handler for retrieving a participant by email.
```

```
Handles request to get a participant by email
@param {object} req - Express request object
@param {object} req.query - Request query parameters
@param {string} req.query.email - Participant email
@param {object} res - Express response object
@returns {Promise<void>}
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participants\getParticipantById.js

```
@file src/db/participant/getParticipantById.js
@description Retrieves a participant record from the database by its ID.
```

```
Retrieves a participant by their ID
@param {number} id - The ID of the participant to retrieve
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object|null>} The participant record, or null if not found
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participants\getParticipantByIdHandler.js

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

## C:\Users\Ken\Desktop\back-stage\backend\db\participants\getParticipantsByGroup.js

```
@file src/db/participant/getParticipantsByGroup.js
@description Retrieves all participants in a specific group.
```

```
Retrieves all participants in a specific group
@param {number} groupId - The ID of the group
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object[]>} Array of participant records with their roles in the group
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participants\getParticipantsByGroupHandler.js

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

## C:\Users\Ken\Desktop\back-stage\backend\db\participants\index.js

```
@file src/db/participants/index.js
@description Exports all participant-related database operations.
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participants\updateParticipant.js

```
@file src/db/participant/updateParticipant.js
@description Updates a participant's information in the database.
```

```
Updates a participant's information
@param {number} id - The ID of the participant to update
@param {object} updates - Object containing fields to update
@param {string} [updates.name] - Updated name
@param {string} [updates.email] - Updated email
@param {string} [updates.password] - Updated password (should be hashed)
@param {number} [createdByParticipantId=null] - ID of participant making the change (for logging)
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object|null>} The updated participant record, or null if not found
@throws {Error} If email already exists or another error occurs
```

## C:\Users\Ken\Desktop\back-stage\backend\db\participants\updateParticipantHandler.js

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

## C:\Users\Ken\Desktop\back-stage\backend\db\preferences\createGroupPreference.js

```
@file src/db/preferences/createGroupPreference.js
@description Creates or updates a group preference in the database.
```

```
Creates or updates a group preference
@param {number} groupId - The ID of the group
@param {number} preferenceTypeId - The ID of the preference type
@param {number} value - The BIGINT value for the preference
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object>} The newly created or updated group preference
@throws {Error} If an error occurs during creation/update
```

## C:\Users\Ken\Desktop\back-stage\backend\db\preferences\createParticipantPreference.js

```
@file src/db/preferences/createParticipantPreference.js
@description Creates or updates a participant preference in the database.
```

```
Creates or updates a participant preference
@param {number} participantId - The ID of the participant
@param {number} preferenceTypeId - The ID of the preference type
@param {number} value - The BIGINT value for the preference
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object>} The newly created or updated participant preference
@throws {Error} If an error occurs during creation/update
```

## C:\Users\Ken\Desktop\back-stage\backend\db\preferences\createSitePreference.js

```
@file src/db/preferences/createSitePreference.js
@description Creates or updates a site-wide preference in the database.
```

```
Creates or updates a site-wide preference
@param {number} preferenceTypeId - The ID of the preference type
@param {number} value - The BIGINT value for the preference
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object>} The newly created or updated site preference
@throws {Error} If an error occurs during creation/update
```

## C:\Users\Ken\Desktop\back-stage\backend\db\preferences\getAllPreferenceTypes.js

```
@file src/db/preferences/getAllPreferenceTypes.js
@description Retrieves all preference types from the database.
```

```
Retrieves all preference types
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Array>} Array of preference types
@throws {Error} If an error occurs during retrieval
```

## C:\Users\Ken\Desktop\back-stage\backend\db\preferences\getPreferenceTypeByName.js

```
@file src/db/preferences/getPreferenceTypeByName.js
@description Retrieves a preference type by its name from the database.
```

```
Retrieves a preference type by its name
@param {string} name - The unique name of the preference type
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object|null>} The preference type or null if not found
@throws {Error} If an error occurs during retrieval
```

## C:\Users\Ken\Desktop\back-stage\backend\db\preferences\getPreferenceWithFallback.js

```
@file src/db/preferences/getPreferenceWithFallback.js
@description Retrieves a preference with fallback hierarchy (participant -> group -> site -> default).
```

```
Retrieves a preference with fallback hierarchy
@param {string} preferenceName - The name of the preference type
@param {number} participantId - The ID of the participant (optional)
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object>} The preference value with source information
@throws {Error} If an error occurs during retrieval or preference type doesn't exist
```

## C:\Users\Ken\Desktop\back-stage\backend\db\preferences\index.js

```
Preferences database operations
@module db/preferences
```

## C:\Users\Ken\Desktop\back-stage\backend\db\topic-paths\createTopicPath.js

```
Creates a new topic path
@param {string} path - The ltree path to create
@param {number} userId - ID of the user creating the path
@param {Pool} pool - The PostgreSQL connection pool to use
@returns {Promise<Object>} The created topic path
```

## C:\Users\Ken\Desktop\back-stage\backend\db\topic-paths\deleteTopicPath.js

```
Delete a topic path from the database.
TODO: In the future, we'll need to handle any posts that use this path
by either preventing deletion if posts exist, moving posts to a different path,
or implementing a soft delete system.
```

```
Delete a topic path and all its descendants from the database.
TODO: In the future, we'll need to handle any posts that use these paths
by either preventing deletion if posts exist, moving posts to a different path,
or implementing a soft delete system.
```

## C:\Users\Ken\Desktop\back-stage\backend\db\topic-paths\getTopicPaths.js

```
Get all topic paths sorted by path
@param {Pool} pool - The PostgreSQL connection pool to use
@returns {Promise<Array>} Array of topic paths
```

## C:\Users\Ken\Desktop\back-stage\backend\db\topic-paths\updateTopicPath.js

```
Update a topic path in the database.
TODO: In the future, we'll need to handle any posts that use this path
by updating their paths as well.
```

## C:\Users\Ken\Desktop\back-stage\backend\middleware\setClientPool.js

```
Middleware to create a database connection pool for the client schema
This middleware determines the schema directly from the request hostname
and uses a cached connection pool for that schema, attaching it to the request object
```

```
Creates a new connection pool for the specified schema
@param {string} schema - Database schema name
@returns {Object} PostgreSQL connection pool
```

```
Determines the schema from the request hostname, gets or creates a connection pool,
and attaches it to the request object as req.clientPool
@param {Object} req - Express request object
@param {Object} res - Express response object
@param {Function} next - Express next middleware function
```

## C:\Users\Ken\Desktop\back-stage\backend\middleware\setClientSchema.js

```
Utility functions for determining client schema
This file provides functions for determining the schema to use
based on hostname, participant attributes, etc.
```

```
Extract the subdomain from the hostname
@param {string} hostname - The hostname from the request
@returns {string|null} - The subdomain or null if no subdomain
```

```
Determines the client schema based on the hostname
@param {string} hostname - The hostname from the request
@returns {string} - The schema name
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

## C:\Users\Ken\Desktop\back-stage\frontend\src\App.js

```
App component
Sets up routing and authentication
```

## C:\Users\Ken\Desktop\back-stage\frontend\src\components\AppHeader.js

```
AppHeader component
Handles the main application header, including branding and user controls
```

## C:\Users\Ken\Desktop\back-stage\frontend\src\components\AppTitle.js

```
AppTitle component
Displays the application title with schema information
```

## C:\Users\Ken\Desktop\back-stage\frontend\src\components\MainLayout.js

```
MainLayout component
Main layout container for the authenticated application
```

## C:\Users\Ken\Desktop\back-stage\frontend\src\components\TopicsMenu.js

```
Convert flat path list to tree structure
```

```
TopicsMenu component
Displays a hierarchical tree of topic paths
```

## C:\Users\Ken\Desktop\back-stage\frontend\src\components\TopicTreeNode.js

```
A single node in the topic tree
```

## C:\Users\Ken\Desktop\back-stage\frontend\src\components\auth\LoginForm.js

```
Login form component
Handles user authentication and form state
```

## C:\Users\Ken\Desktop\back-stage\frontend\src\components\auth\LogoutButton.js

```
LogoutButton component
Handles user logout and navigation
```

## C:\Users\Ken\Desktop\back-stage\frontend\src\components\auth\PrivateRoute.js

```
PrivateRoute component
Protects routes that require authentication
Redirects to login if user is not authenticated
```

## C:\Users\Ken\Desktop\back-stage\frontend\src\services\auth\authApi.js

```
Authentication API service
Handles all authentication-related API calls
```

```
Send login request to the server
@param {string} email User's email
@param {string} password User's password
@returns {Promise<Object>} Response data including token and user info
```

```
Send logout request to the server
@returns {Promise<void>}
```

```
Check current authentication status
@returns {Promise<Object>} User authentication status and data
```

## C:\Users\Ken\Desktop\back-stage\frontend\src\services\auth\authContext.js

```
Provider component for authentication state
Manages auth state and provides login/logout functions
```

```
Custom hook to use authentication context
@returns {Object} Authentication context value
```

## C:\Users\Ken\Desktop\back-stage\frontend\src\services\topics\topicsApi.js

```
Topic paths API service
```

```
Fetch all topic paths sorted by path
@returns {Promise<Array>} Sorted array of topic paths
```

```
Create a new topic path
@param {string} path - The path to create
@returns {Promise<Object>} The created topic path
```

```
Delete a topic path
@param {string} path - The path to delete
@returns {Promise<Object>} The deleted topic path
```

```
Update a topic path
@param {string} oldPath - The old path to update
@param {string} newPath - The new path to update to
@returns {Promise<Object>} The updated topic path
```

## C:\Users\Ken\Desktop\back-stage\frontend\vanilla-build\api.js

```
Fetch CSRF token for API requests
```

```
Helper function to get API base URL (copied from login.html)
```

```
Function to test CSRF token
```

```
Function to test authentication
```

## C:\Users\Ken\Desktop\back-stage\frontend\vanilla-build\conversations.js

```
Conversations module - Handles conversation-related functionality
```

```
Fetch conversations for a specific group
@param {number} groupId - The group ID
@returns {Promise<Array>} - Array of conversations
```

```
Create a new conversation
@param {number} groupId - The group ID
@param {string} name - Conversation name
@param {string} description - Conversation description
@returns {Promise<Object>} - The created conversation
```

```
Display conversations in the conversations list
@param {Array} conversations - Array of conversation objects
@param {Function} onSelect - Callback function when a conversation is selected
```

```
Handle new conversation button click
@param {number} groupId - The current group ID
@param {Function} onConversationCreated - Callback after conversation is created
```

## C:\Users\Ken\Desktop\back-stage\frontend\vanilla-build\main.js

```
Load groups from the server
```

```
Select a group and load its conversations and templates
```

```
Handle selection of a conversation
```

```
Handle selection of a template
```

```
Handle creation of a new conversation
```

```
Handle creation of a new template
```

```
Handle creation of a new topic
```

```
Initialize message input and send button
```

```
Send a message
```

```
Add a message to the transcript
```

## C:\Users\Ken\Desktop\back-stage\frontend\vanilla-build\templates.js

```
Templates module - Handles template-related functionality
```

```
Fetch templates for a specific group
@param {number} groupId - The group ID
@returns {Promise<Array>} - Array of templates
```

```
Create a new template
@param {number} groupId - The group ID
@param {string} name - Template name
@param {string} description - Template description
@returns {Promise<Object>} - The created template
```

```
Display templates in the templates list
@param {Array} templates - Array of template objects
@param {Function} onSelect - Callback function when a template is selected
```

```
Handle new template button click
@param {number} groupId - The current group ID
@param {Function} onTemplateCreated - Callback after template is created
```

## C:\Users\Ken\Desktop\back-stage\frontend\vanilla-build\topics.js

```
Topics module - Handles template topics functionality
```

```
Fetch topics for a specific template
@param {number} templateId - The template ID
@returns {Promise<Array>} - Array of topics
```

```
Create a new topic
@param {number} templateId - The template ID
@param {string} title - Topic title
@param {string} content - Topic content
@param {number} topicIndex - Topic index for ordering
@returns {Promise<Object>} - The created topic
```

```
Display topics in the topics list
@param {Array} topics - Array of topic objects
@param {Function} onSelect - Callback function when a topic is selected
```

```
Handle new topic button click
@param {number} templateId - The current template ID
@param {Function} onTopicCreated - Callback after topic is created
```

```
Handle topic selection
@param {Object} topic - The selected topic
```

## C:\Users\Ken\Desktop\back-stage\frontend\vanilla-build\utils.js

```
Debug helper function to show detailed information
```

```
Log function to simplify debugging
```

```
Function to inspect localStorage for tokens
```

## C:\Users\Ken\Desktop\back-stage\frontend\vanilla-build\auth\authApi.js

```
Send login request to the server
@param {string} email User's email
@param {string} password User's password
@returns {Promise<Object>} Response data and status
```

```
Send logout request to the server
@returns {Promise<Object>} Response status
```

```
Check authentication status with the server
@param {string} token Authentication token
@returns {Promise<Object>} Auth status and user data
```

## C:\Users\Ken\Desktop\back-stage\frontend\vanilla-build\auth\authForms.js

```
Handle login form submission
@param {Event} event Form submission event
```

```
Handle logout action
```

## C:\Users\Ken\Desktop\back-stage\frontend\vanilla-build\auth\authNavigation.js

```
Handles the special case of first-time login navigation to solve token processing issues.
When a user first logs in, there can be a race condition where the page loads
before the browser has fully processed the authentication tokens (cookies/localStorage).
This can cause the page to incorrectly think the user isn't authenticated.
This function works by:
1. Detecting the 'firstLogin=true' URL parameter (added during login redirect)
2. Cleaning up the URL to remove the parameter
3. Allowing the main auth flow to trigger a page reload if needed
The reload gives the browser time to properly process auth tokens, preventing
the user from seeing the login screen again right after logging in.
@returns {boolean} True if this was a first-time login (URL had firstLogin=true)
```

```
Redirect to login page
```

```
Redirect to home page
```

## C:\Users\Ken\Desktop\back-stage\frontend\vanilla-build\auth\authOrchestrator.js

```
Update UI and handle first-time login cases
```

```
Initialize authentication state
Checks token validity and updates UI accordingly
```

## C:\Users\Ken\Desktop\back-stage\frontend\vanilla-build\auth\authState.js

```
Check if user is authenticated based on token presence
```

```
Get the current authentication token
```

```
Clear all authentication data
```

```
Set authentication token
```

## C:\Users\Ken\Desktop\back-stage\frontend\vanilla-build\auth\authUI.js

```
Update UI elements based on authentication state
```

## C:\Users\Ken\Desktop\back-stage\frontend\vanilla-build\auth\userSession.js

```
Get current user's username
```

```
Set current user's username
```

```
Clear user session data
```

## C:\Users\Ken\Desktop\back-stage\previous\public\scripts\api.js

```
Fetch CSRF token for API requests
```

```
Helper function to get API base URL (copied from login.html)
```

```
Function to test CSRF token
```

```
Function to test authentication
```

## C:\Users\Ken\Desktop\back-stage\previous\public\scripts\auth.js

```
Update UI based on authentication state
```

```
Check authentication status using JWT token
```

```
Handle login form submission
```

```
Handle logout
```

## C:\Users\Ken\Desktop\back-stage\previous\public\scripts\conversations.js

```
Conversations module - Handles conversation-related functionality
```

```
Fetch conversations for a specific group
@param {number} groupId - The group ID
@returns {Promise<Array>} - Array of conversations
```

```
Create a new conversation
@param {number} groupId - The group ID
@param {string} name - Conversation name
@param {string} description - Conversation description
@returns {Promise<Object>} - The created conversation
```

```
Display conversations in the conversations list
@param {Array} conversations - Array of conversation objects
@param {Function} onSelect - Callback function when a conversation is selected
```

```
Handle new conversation button click
@param {number} groupId - The current group ID
@param {Function} onConversationCreated - Callback after conversation is created
```

## C:\Users\Ken\Desktop\back-stage\previous\public\scripts\main.js

```
Load groups from the server
```

```
Select a group and load its conversations and templates
```

```
Handle selection of a conversation
```

```
Handle selection of a template
```

```
Handle creation of a new conversation
```

```
Handle creation of a new template
```

```
Handle creation of a new topic
```

```
Initialize the message input and send button
```

```
Send a message
```

```
Add a message to the transcript
```

## C:\Users\Ken\Desktop\back-stage\previous\public\scripts\templates.js

```
Templates module - Handles template-related functionality
```

```
Fetch templates for a specific group
@param {number} groupId - The group ID
@returns {Promise<Array>} - Array of templates
```

```
Create a new template
@param {number} groupId - The group ID
@param {string} name - Template name
@param {string} description - Template description
@returns {Promise<Object>} - The created template
```

```
Display templates in the templates list
@param {Array} templates - Array of template objects
@param {Function} onSelect - Callback function when a template is selected
```

```
Handle new template button click
@param {number} groupId - The current group ID
@param {Function} onTemplateCreated - Callback after template is created
```

## C:\Users\Ken\Desktop\back-stage\previous\public\scripts\topics.js

```
Topics module - Handles template topics functionality
```

```
Fetch topics for a specific template
@param {number} templateId - The template ID
@returns {Promise<Array>} - Array of topics
```

```
Create a new topic
@param {number} templateId - The template ID
@param {string} title - Topic title
@param {string} content - Topic content
@param {number} topicIndex - Topic index for ordering
@returns {Promise<Object>} - The created topic
```

```
Display topics in the topics list
@param {Array} topics - Array of topic objects
@param {Function} onSelect - Callback function when a topic is selected
```

```
Handle new topic button click
@param {number} templateId - The current template ID
@param {Function} onTopicCreated - Callback after topic is created
```

```
Handle topic selection
@param {Object} topic - The selected topic
```

## C:\Users\Ken\Desktop\back-stage\previous\public\scripts\utils.js

```
Debug helper function to show detailed information
```

```
Log function to simplify debugging
```

```
Function to inspect localStorage for tokens
```

## C:\Users\Ken\Desktop\back-stage\previous\src\config\schema.js

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

## C:\Users\Ken\Desktop\back-stage\previous\src\controllers\participants\loginHandler.js

```
Handles participant login requests and sets an HttpOnly cookie
```

## C:\Users\Ken\Desktop\back-stage\previous\src\controllers\participants\logoutHandler.js

```
Handles participant logout requests and clears the HttpOnly cookie
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\connection.js

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

## C:\Users\Ken\Desktop\back-stage\previous\src\db\pool.js

```
@file src/db/pool.js
@description PostgreSQL connection pool setup
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConAvatars\createGrpConAvatar.js

```
@file src/db/grpConAvatars/createGrpConAvatar.js
@description Adds an avatar to a group conversation.
```

```
Inserts a new row into grp_con_avatars.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} conversationId
@param {number} avatarId
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<{grp_con_id: number, avatar_id: number, added_at: string}>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConAvatars\deleteGrpConAvatar.js

```
@file src/db/grpConAvatars/deleteGrpConAvatar.js
@description Removes an avatar from a conversation.
```

```
Deletes the link between an avatar and a conversation.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} conversationId
@param {number} avatarId
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<boolean>} true if deleted, false otherwise
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConAvatars\getGrpConAvatarsByConversation.js

```
@file src/db/grpConAvatars/getGrpConAvatarsByConversation.js
@description Lists all avatars in a given conversation.
```

```
Fetches avatar entries for one conversation.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} conversationId
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<Array<{avatar_id: number, added_at: string}>>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConAvatars\getGrpConsByAvatar.js

```
@file src/db/grpConAvatars/getGrpConsByAvatar.js
@description Lists all conversations that include a given avatar.
```

```
Fetches conversation entries for one avatar.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} avatarId
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<Array<{grp_con_id: number, added_at: string}>>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConAvatarTurnRelationships\createGrpConAvatarTurnRelationship.js

```
Creates a directed relationship between two avatar turns.
@param {number} turnId
@param {number} targetTurnId
@param {number} [relationshipTypeId=1]
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConAvatarTurnRelationships\deleteGrpConAvatarTurnRelationship.js

```
Deletes a relationship by its ID.
@param {number} id
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<boolean>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConAvatarTurnRelationships\getGrpConAvatarTurnRelationshipById.js

```
Fetches a relationship by its ID.
@param {number} id
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object|null>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConAvatarTurnRelationships\getGrpConAvatarTurnRelationshipsByTurn.js

```
Lists all relationships originating from a turn.
@param {number} turnId
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object[]>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConAvatarTurnRelationships\updateGrpConAvatarTurnRelationship.js

```
Updates the relationship type of an existing relationship.
@param {number} id
@param {number} newTypeId
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object|null>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConAvatarTurns\createGrpConAvatarTurn.js

```
Creates a new avatar turn in a group conversation
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} conversationId - The ID of the conversation
@param {number} avatarId - The ID of the avatar
@param {number|string} turnIndex - The index of the turn (can be decimal for comments)
@param {string} contentText - The text content of the turn
@param {Array} contentVector - The vector representation of the content
@param {number} [turnKindId=TURN_KIND.REGULAR] - The kind of turn (regular or comment)
@param {number} [messageTypeId=null] - The type of message (1 for user, 2 for LLM)
@param {string|object} schemaOrPool - Either a schema name or a pool object
@returns {Promise<Object>} The created turn
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConAvatarTurns\deleteGrpConAvatarTurn.js

```
Delete a group conversation avatar turn by ID
@param {number} id - The ID of the turn to delete
@param {string|object} schemaOrPool - Either a schema name or a pool object
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<boolean>} True if the turn was deleted, false if not found
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConAvatarTurns\getGrpConAvatarTurnById.js

```
Get a group conversation avatar turn by ID
@param {number} id - The ID of the turn to retrieve
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object|null>} The turn object or null if not found
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConAvatarTurns\getGrpConAvatarTurnsByConversation.js

```
Parse a vector string from the database into an array of numbers
@param { Pool } pool - The PostgreSQL connection pool.
@param {string} vectorStr - The vector string from the database (e.g., "[0.1,0.2,0.3]")
@returns {number[]} The parsed vector as an array of numbers
```

```
Get all avatar turns for a specific conversation
@param {number} conversationId - The ID of the conversation
@param {string|object} [schemaOrPool=null] - Schema name or custom pool
@returns {Promise<Array>} List of avatar turns for the conversation
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConAvatarTurns\updateGrpConAvatarTurn.js

```
Update a group conversation avatar turn
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} id - The ID of the turn to update
@param {string} newText - The new text content
@param {Array<number>} newVector - The new vector content
@returns {Promise<object>} The updated turn
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpCons\createGrpCon.js

```
Creates a new conversation under a group.
@param {number} groupId - The ID of the group.
@param {string} name - The conversation name.
@param {string} description - The conversation description.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} [typeId=1] - The type ID from grp_con_types table (1=conversation, 2=template)
@returns {Promise<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpCons\deleteGrpCon.js

```
Deletes a conversation by its ID.
@param {number} id - The conversation ID.
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<boolean>} True if deleted, false otherwise.
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpCons\getGrpConById.js

```
Retrieves a conversation by its ID.
@param {number} id - The conversation ID.
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}|null>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpCons\getGrpConsByGroup.js

```
Retrieves conversations for a given group, ordered by creation date (newest first) and limited to 50.
Optionally filters by conversation type.
@param {number} groupId - The group ID.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number|null} [typeId=null] - The type ID to filter by (1=conversation, 2=template), or null for all types
@returns {Promise<Array<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}>>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpCons\updateGrpCon.js

```
Updates a conversation's name, description, and optionally its type.
@param {number} id - The conversation ID.
@param {string} newName - The new conversation name.
@param {string} newDescription - The new conversation description.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number|null} [newTypeId=null] - The new type ID from grp_con_types table (1=conversation, 2=template), or null to keep current type
@returns {Promise<{id: number, group_id: number, name: string, description: string, type_id: number, created_at: string}|null>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConTemplateInstances\createGrpConTemplateInstance.js

```
@file src/db/grpConTemplateInstances/createGrpConTemplateInstance.js
@description Creates a new template instance.
```

```
Creates a new template instance.
@param {number} templateId - The ID of the template
@param {number} groupId - The ID of the group
@param {string} name - The name of the instance (optional, defaults to template name with timestamp)
@param {string} description - The description of the instance (optional)
@param {Pool} pool - The PostgreSQL connection pool
@returns {Promise<{id: number, template_id: number, group_id: number, name: string, description: string, created_at: Date}>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConTemplateInstances\getGrpConTemplateInstancesByTemplate.js

```
@file src/db/grpConTemplateInstances/getGrpConTemplateInstancesByTemplate.js
@description Lists all instances for a given template.
```

```
Fetches template instances for one template.
@param {Pool} pool - The PostgreSQL connection pool.
@param {number} templateId - The ID of the template
@returns {Promise<Array<{id: number, template_id: number, group_id: number, name: string, description: string, created_at: Date}>>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConTemplateTopics\createGrpConTemplateTopic.js

```
@file src/db/grpConTemplateTopics/createGrpConTemplateTopic.js
@description Creates a new topic for a template.
```

```
Inserts a new row into grp_con_template_topics.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} templateId - The ID of the template
@param {string} title - The title of the topic
@param {string} content - The content of the topic (can be empty)
@param {number} topicIndex - The index of the topic for ordering
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<{id: number, template_id: number, title: string, content: string, topic_index: number}>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConTemplateTopics\deleteGrpConTemplateTopic.js

```
@file src/db/grpConTemplateTopics/deleteGrpConTemplateTopic.js
@description Deletes a template topic.
```

```
Deletes a template topic by ID.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} topicId - The ID of the topic to delete
@param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
@returns {Promise<{id: number, template_id: number, title: string, content: string, topic_index: number}|null>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConTemplateTopics\getGrpConTemplateTopicById.js

```
@file src/db/grpConTemplateTopics/getGrpConTemplateTopicById.js
@description Retrieves a single template topic by its ID.
```

```
Fetches a single template topic by ID.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} topicId - The ID of the topic to retrieve
@returns {Promise<{id: number, template_id: number, title: string, content: string, topic_index: number}|null>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConTemplateTopics\getGrpConTemplateTopicsByTemplate.js

```
@file src/db/grpConTemplateTopics/getGrpConTemplateTopicsByTemplate.js
@description Lists all topics for a given template, ordered by topic_index.
```

```
Fetches topic entries for one template.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} templateId - The ID of the template
@returns {Promise<Array<{id: number, template_id: number, title: string, content: string, topic_index: number}>>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConTemplateTopics\updateGrpConTemplateTopic.js

```
@file src/db/grpConTemplateTopics/updateGrpConTemplateTopic.js
@description Updates an existing template topic.
```

```
Updates a template topic.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} topicId - The ID of the topic to update
@param {string} title - The updated title
@param {string} content - The updated content
@param {number} topicIndex - The updated topic index
** @returns {Promise<{id: number, template_id: number, title: string, content: string, topic_index: number}|null>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConUploads\createGrpConUpload.js

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
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Object>} - The created upload record
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConUploads\deleteGrpConUpload.js

```
Delete a group conversation upload record
@module db/grpConUploads/deleteGrpConUpload
```

```
Delete a group conversation upload record
@param {number} id - The upload ID
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<boolean>} - True if deletion was successful
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConUploads\getGrpConUploadById.js

```
Get a group conversation upload by ID
@module db/grpConUploads/getGrpConUploadById
```

```
Get a group conversation upload by ID
@param {number} id - The upload ID
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Object|null>} - The upload record or null if not found
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConUploads\getGrpConUploadsByConversation.js

```
Get all uploads for a specific group conversation
@module db/grpConUploads/getGrpConUploadsByConversation
```

```
Get all uploads for a specific group conversation
@param {number} grpConId - The group conversation ID
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Array>} - Array of upload records
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConUploads\index.js

```
Group conversation uploads database operations
@module db/grpConUploads
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConUploadVectors\createGrpConUploadVector.js

```
Create a new group conversation upload vector record
@module db/grpConUploadVectors/createGrpConUploadVector
```

```
Create a new group conversation upload vector record
@param {Object} vectorData - The vector data
@param {number} vectorData.uploadId - The upload ID
@param {number} vectorData.chunkIndex - The chunk index
@param {string} vectorData.contentText - The text content of the chunk
@param {Array<number>} [vectorData.contentVector] - The vector representation of the content (optional)
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Object>} - The created vector record
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConUploadVectors\getGrpConUploadVectorsByUpload.js

```
Get group conversation upload vectors by upload ID
@module db/grpConUploadVectors/getGrpConUploadVectorsByUpload
```

```
Get group conversation upload vectors by upload ID
@param {number} uploadId - The upload ID
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Array<Object>>} - The vector records
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\grpConUploadVectors\index.js

```
Group conversation upload vectors database operations
@module db/grpConUploadVectors
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participantAvatars\createParticipantAvatar.js

```
@file src/db/participantAvatars/createParticipantAvatar.js
@description Creates a new participant-avatar relationship.
```

```
Creates a new participant-avatar relationship.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} participantId - The ID of the participant
@param {number} avatarId - The ID of the avatar
@param {number} [createdByParticipantId=null] - The ID of the participant who created this relationship
@returns {Promise<object>} The newly created participant-avatar relationship
@throws {Error} If the operation fails
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participantAvatars\deleteParticipantAvatar.js

```
@file src/db/participantAvatars/deleteParticipantAvatar.js
@description Deletes a participant-avatar relationship.
```

```
Deletes a participant-avatar relationship by ID.
@param { Pool } pool - The PostgreSQL connection pool.
@param {number} id - The ID of the participant-avatar relationship to delete
@returns {Promise<object|null>} The deleted relationship or null if not found
@throws {Error} If the operation fails
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participantAvatars\getParticipantAvatarById.js

```
@file src/db/participantAvatars/getParticipantAvatarById.js
@description Retrieves a participant-avatar relationship by ID.
```

```
Retrieves a participant-avatar relationship by ID.
@param {number} id - The ID of the participant-avatar relationship
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object|null>} The participant-avatar relationship or null if not found
@throws {Error} If the operation fails
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participantAvatars\getParticipantAvatarsByAvatar.js

```
@file src/db/participantAvatars/getParticipantAvatarsByAvatar.js
@description Retrieves all participant relationships for a specific avatar.
```

```
Retrieves all participant relationships for a specific avatar.
@param {number} avatarId - The ID of the avatar
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Array<object>>} Array of participant-avatar relationships
@throws {Error} If the operation fails
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participantAvatars\getParticipantAvatarsByParticipant.js

```
@file src/db/participantAvatars/getParticipantAvatarsByParticipant.js
@description Retrieves all avatar relationships for a specific participant.
```

```
Retrieves all avatar relationships for a specific participant.
@param {number} participantId - The ID of the participant
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Array<object>>} Array of participant-avatar relationships
@throws {Error} If the operation fails
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participantAvatars\index.js

```
@file src/db/participantAvatars/index.js
@description Exports all participant-avatar relationship database operations.
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participantEvents\createParticipantEvent.js

```
@file src/db/participantEvents/createParticipantEvent.js
@description Creates a new participant event record in the database.
```

```
Creates a new participant event in the database
@param {number} participantId - The ID of the participant
@param {number} eventTypeId - The ID of the event type
@param {object} [details=null] - Optional JSON details about the event
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object>} The newly created participant event record
@throws {Error} If an error occurs during creation
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participantEvents\getParticipantEventById.js

```
@file src/db/participantEvents/getParticipantEventById.js
@description Retrieves a participant event by its ID.
```

```
Retrieves a participant event by its ID
@param {number} id - The ID of the participant event to retrieve
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object|null>} The participant event record or null if not found
@throws {Error} If an error occurs during retrieval
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participantEvents\getParticipantEventsByParticipant.js

```
@file src/db/participantEvents/getParticipantEventsByParticipant.js
@description Retrieves all events for a specific participant.
```

```
Retrieves all events for a specific participant
@param {number} participantId - The ID of the participant
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Array>} Array of participant event records
@throws {Error} If an error occurs during retrieval
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participantEvents\getParticipantEventsByType.js

```
@file src/db/participantEvents/getParticipantEventsByType.js
@description Retrieves all events of a specific type.
```

```
Retrieves all events of a specific type
@param {number} eventTypeId - The ID of the event type
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Array>} Array of participant event records
@throws {Error} If an error occurs during retrieval
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participantEvents\index.js

```
@file src/db/participantEvents/index.js
@description Export all participant events database functions
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participants\createParticipant.js

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
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object>} The newly created participant record
@throws {Error} If email already exists or another error occurs
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participants\createParticipantHandler.js

```
@file src/api/participants/createParticipantHandler.js
@description Handler for creating a new participant.
```

```
Handles request to create a new participant
@param {object} req.body - Request body
@param {string} req.body.name - Participant name
@param {string} req.body.email - Participant email
@param { Pool } pool - The PostgreSQL connection pool.
@param {string} req.body.password - Participant password (will be hashed)
@param {object} res - Express response object
@returns {Promise<void>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participants\deleteParticipant.js

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
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<boolean>} True if a participant was deleted, false otherwise
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participants\deleteParticipantHandler.js

```
@file src/api/participants/deleteParticipantHandler.js
@description Handler for deleting a participant.
```

```
Handles request to delete a participant
@param {object} req - Express request object
@param {object} req.params - Request parameters
@param {string} req.params.id - Participant ID
@param { Pool } pool - The PostgreSQL connection pool.
@param {object} res - Express response object
@returns {Promise<void>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participants\getAllParticipants.js

```
@file src/db/participant/getAllParticipants.js
@description Retrieves all participant records from the database.
```

```
Retrieves all participants from the database
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object[]>} Array of participant records
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participants\getAllParticipantsHandler.js

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

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participants\getParticipantByEmail.js

```
@file src/db/participant/getParticipantByEmail.js
@description Retrieves a participant record from the database by email address.
```

```
Retrieves a participant by their email address
@param {string} email - The email of the participant to retrieve
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object|null>} The participant record, or null if not found
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participants\getParticipantByEmailHandler.js

```
@file src/db/participants/getParticipantByEmailHandler.js
@description Handler for retrieving a participant by email.
```

```
Handles request to get a participant by email
@param {object} req - Express request object
@param {object} req.query - Request query parameters
@param {string} req.query.email - Participant email
@param {object} res - Express response object
@returns {Promise<void>}
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participants\getParticipantById.js

```
@file src/db/participant/getParticipantById.js
@description Retrieves a participant record from the database by its ID.
```

```
Retrieves a participant by their ID
@param {number} id - The ID of the participant to retrieve
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object|null>} The participant record, or null if not found
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participants\getParticipantByIdHandler.js

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

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participants\getParticipantsByGroup.js

```
@file src/db/participant/getParticipantsByGroup.js
@description Retrieves all participants in a specific group.
```

```
Retrieves all participants in a specific group
@param {number} groupId - The ID of the group
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object[]>} Array of participant records with their roles in the group
@throws {Error} If a database error occurs
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participants\getParticipantsByGroupHandler.js

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

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participants\index.js

```
@file src/db/participants/index.js
@description Exports all participant-related database operations.
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participants\updateParticipant.js

```
@file src/db/participant/updateParticipant.js
@description Updates a participant's information in the database.
```

```
Updates a participant's information
@param {number} id - The ID of the participant to update
@param {object} updates - Object containing fields to update
@param {string} [updates.name] - Updated name
@param {string} [updates.email] - Updated email
@param {string} [updates.password] - Updated password (should be hashed)
@param {number} [createdByParticipantId=null] - ID of participant making the change (for logging)
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object|null>} The updated participant record, or null if not found
@throws {Error} If email already exists or another error occurs
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\participants\updateParticipantHandler.js

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

## C:\Users\Ken\Desktop\back-stage\previous\src\db\preferences\createGroupPreference.js

```
@file src/db/preferences/createGroupPreference.js
@description Creates or updates a group preference in the database.
```

```
Creates or updates a group preference
@param {number} groupId - The ID of the group
@param {number} preferenceTypeId - The ID of the preference type
@param {number} value - The BIGINT value for the preference
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object>} The newly created or updated group preference
@throws {Error} If an error occurs during creation/update
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\preferences\createParticipantPreference.js

```
@file src/db/preferences/createParticipantPreference.js
@description Creates or updates a participant preference in the database.
```

```
Creates or updates a participant preference
@param {number} participantId - The ID of the participant
@param {number} preferenceTypeId - The ID of the preference type
@param {number} value - The BIGINT value for the preference
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object>} The newly created or updated participant preference
@throws {Error} If an error occurs during creation/update
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\preferences\createSitePreference.js

```
@file src/db/preferences/createSitePreference.js
@description Creates or updates a site-wide preference in the database.
```

```
Creates or updates a site-wide preference
@param {number} preferenceTypeId - The ID of the preference type
@param {number} value - The BIGINT value for the preference
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object>} The newly created or updated site preference
@throws {Error} If an error occurs during creation/update
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\preferences\getAllPreferenceTypes.js

```
@file src/db/preferences/getAllPreferenceTypes.js
@description Retrieves all preference types from the database.
```

```
Retrieves all preference types
@param {object} [customPool=pool] - Database connection pool (for testing)
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<Array>} Array of preference types
@throws {Error} If an error occurs during retrieval
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\preferences\getPreferenceTypeByName.js

```
@file src/db/preferences/getPreferenceTypeByName.js
@description Retrieves a preference type by its name from the database.
```

```
Retrieves a preference type by its name
@param {string} name - The unique name of the preference type
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object|null>} The preference type or null if not found
@throws {Error} If an error occurs during retrieval
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\preferences\getPreferenceWithFallback.js

```
@file src/db/preferences/getPreferenceWithFallback.js
@description Retrieves a preference with fallback hierarchy (participant -> group -> site -> default).
```

```
Retrieves a preference with fallback hierarchy
@param {string} preferenceName - The name of the preference type
@param {number} participantId - The ID of the participant (optional)
@param { Pool } pool - The PostgreSQL connection pool.
@returns {Promise<object>} The preference value with source information
@throws {Error} If an error occurs during retrieval or preference type doesn't exist
```

## C:\Users\Ken\Desktop\back-stage\previous\src\db\preferences\index.js

```
Preferences database operations
@module db/preferences
```

## C:\Users\Ken\Desktop\back-stage\previous\src\middleware\auth.js

```
Simplified dual authentication middleware that maintains the core
principles of the original implementation:
1. Primary: Uses HTTP-only cookies (more secure)
2. Fallback: Checks Authorization headers with Bearer tokens
3. Clear logging for debugging authentication issues
This simplified approach maintains compatibility with your existing
dual authentication system while removing unnecessary complexity.
```

## C:\Users\Ken\Desktop\back-stage\previous\src\middleware\auth_old.js

```
Simplified dual authentication middleware that maintains the core
principles of the original implementation:
1. Primary: Uses HTTP-only cookies (more secure)
2. Fallback: Checks Authorization headers with Bearer tokens
3. Clear logging for debugging authentication issues
This simplified approach maintains compatibility with your existing
dual authentication system while removing unnecessary complexity.
```

## C:\Users\Ken\Desktop\back-stage\previous\src\middleware\setClientPool.js

```
Middleware to create a database connection pool for the client schema
This middleware determines the schema directly from the request hostname
and uses a cached connection pool for that schema, attaching it to the request object
```

```
Determines the schema from the request hostname, gets or creates a connection pool,
and attaches it to the request object as req.clientPool
@param {Object} req - Express request object
@param {Object} res - Express response object
@param {Function} next - Express next middleware function
```

## C:\Users\Ken\Desktop\back-stage\previous\src\middleware\setClientSchema.js

```
Utility functions for determining client schema
This file provides functions for determining the schema to use
based on hostname, participant attributes, etc.
```

```
Extract the subdomain from the hostname
@param {string} hostname - The hostname from the request
@returns {string|null} - The subdomain or null if no subdomain
```

```
Determines the client schema based on the hostname
@param {string} hostname - The hostname from the request
@returns {string} - The schema name
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

## C:\Users\Ken\Desktop\back-stage\previous\src\middleware\simplified-auth.js

```
A simplified authentication middleware that prioritizes HTTP-only cookies
but provides a clear fallback mechanism for bearer tokens.
This avoids complex conditional logic and provides consistent
authentication across environments.
```

## C:\Users\Ken\Desktop\back-stage\previous\src\routes\conversations.js

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

## C:\Users\Ken\Desktop\back-stage\previous\src\routes\direct-auth.js

```
Direct authentication route that bypasses session and CSRF
This provides a reliable fallback when the main auth system has issues
```

```
GET /api/direct-auth
A simplified authentication endpoint that only needs the JWT token
This bypasses the session system completely
```

## C:\Users\Ken\Desktop\back-stage\previous\src\routes\groups.js

```
@file src/routes/groups.js
@description Creates routes for all the group functions.
```

## C:\Users\Ken\Desktop\back-stage\previous\src\routes\grpConAvatars.js

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

## C:\Users\Ken\Desktop\back-stage\previous\src\routes\grpConAvatarTurnRelationships.js

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

## C:\Users\Ken\Desktop\back-stage\previous\src\routes\grpConAvatarTurns.js

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

## C:\Users\Ken\Desktop\back-stage\previous\src\routes\grpCons.js

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
body: { newName, newDescription, newTypeId, template_id }
```

```
DELETE /api/grpCons/:id
```

## C:\Users\Ken\Desktop\back-stage\previous\src\routes\grpConTemplateInstances.js

```
POST   /api/grp-con-template-instances
body: { template_id, group_id, name, description }
```

```
GET    /api/grp-con-template-instances/by-template/:templateId
```

## C:\Users\Ken\Desktop\back-stage\previous\src\routes\grpConTemplateTopics.js

```
POST   /api/grp-con-template-topics
body: { template_id, title, content, topic_index }
```

```
GET    /api/grp-con-template-topics/by-template/:templateId
```

```
GET    /api/grp-con-template-topics/:topicId
```

```
PUT    /api/grp-con-template-topics/:topicId
body: { title, content, topic_index }
```

```
DELETE /api/grp-con-template-topics/:topicId
```

## C:\Users\Ken\Desktop\back-stage\previous\src\routes\grpConUploads.js

```
Group conversation uploads routes
@module routes/grpConUploads
```

```
Split text into chunks with overlap
@param {string} text - The text to split
@param {number} maxChunkSize - Maximum size of each chunk
@param {number} overlap - Number of characters to overlap between chunks
@returns {Array<string>} Array of text chunks
```

```
Upload a file to a conversation
@name POST /api/grp-con-uploads
@function
@memberof module:routes/grpConUploads
@param {string} req.body.grpConId - The conversation ID
@param {string} req.body.avatarId - The avatar ID (optional, defaults to participant's avatar)
@param {File} req.file - The file to upload
@returns {Object} The created upload record with chunk count
```

```
Get a specific file by ID
@name GET /api/grp-con-uploads/:id
@function
@memberof module:routes/grpConUploads
@param {string} req.params.id - The upload ID
@param {boolean} [req.query.vectors] - Whether to include vectors in the response
@returns {Object} The file data or upload record with vectors
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

## C:\Users\Ken\Desktop\back-stage\previous\src\routes\grpTemplates.js

```
GET /api/grp-templates/by-group/:groupId
Fetches all templates belonging to a specific group
```

```
GET /api/grp-templates/:id
Fetches a specific template by ID
```

```
POST /api/grp-templates
Creates a new template for a group
```

## C:\Users\Ken\Desktop\back-stage\previous\src\routes\grpTemplateTopics.js

```
GET /api/grp-template-topics/by-template/:templateId
Fetches all topics belonging to a specific template
```

```
GET /api/grp-template-topics/:id
Fetches a specific topic by ID
```

```
POST /api/grp-template-topics
Creates a new topic for a template
```

## C:\Users\Ken\Desktop\back-stage\previous\src\routes\me.js

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

## C:\Users\Ken\Desktop\back-stage\previous\src\routes\participantAvatars.js

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

## C:\Users\Ken\Desktop\back-stage\previous\src\routes\participantEvents.js

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

## C:\Users\Ken\Desktop\back-stage\previous\src\routes\participants.js

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

## C:\Users\Ken\Desktop\back-stage\previous\src\routes\preferences.js

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

## C:\Users\Ken\Desktop\back-stage\previous\src\services\authService.js

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

## C:\Users\Ken\Desktop\back-stage\previous\src\services\embeddingService.js

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

## C:\Users\Ken\Desktop\back-stage\previous\src\services\llmService.js

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
@param {Object|string} poolOrSchema - Either a connection pool object or a schema name string
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

## C:\Users\Ken\Desktop\back-stage\previous\src\services\supabaseService.js

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

## C:\Users\Ken\Desktop\back-stage\previous\src\utils\clientSchema.js

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

## C:\Users\Ken\Desktop\back-stage\scripts\copy-build.js

```
Script to copy React build files to the backend/public directory
Works cross-platform on both Windows and Linux environments
```

