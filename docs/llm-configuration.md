# LLM Configuration Module

This module provides functionality to manage LLM (Large Language Model) configurations for different client schemas in the application.

## Overview

The LLM Configuration module allows:
- Fetching the current LLM configuration for a client schema
- Updating the LLM configuration for a client schema
- Falling back to a default LLM configuration when none is set

## Database Schema

The module uses the following database tables:

### `llms`
Stores the available LLM configurations.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(255) | Display name of the LLM |
| provider | VARCHAR(100) | Provider name (e.g., 'openai', 'anthropic') |
| model | VARCHAR(100) | Model identifier |
| temperature | FLOAT | Default temperature setting |
| max_tokens | INTEGER | Maximum tokens to generate |
| additional_config | JSONB | Additional model-specific configuration |
| is_default | BOOLEAN | Whether this is the default LLM |
| type_id | INTEGER | Foreign key to llm_types |

### `llm_types`
Defines different types of LLMs and their handlers.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(100) | Type name (e.g., 'openai', 'anthropic') |
| api_handler | VARCHAR(100) | Name of the API handler function |

### `client_schema_preferences`
Stores client schema-specific preferences, including LLM preferences.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| client_schema_id | INTEGER | Reference to client schema |
| preference_type_id | INTEGER | Reference to preference type |
| preference_value | JSONB | Preference value |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### `preference_types`
Defines types of preferences that can be stored.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(100) | Preference type name |
| description | TEXT | Description of the preference type |

## API Endpoints

### Get LLM Configuration

Retrieves the LLM configuration for a specific client schema.

```http
GET /api/client-schemas/:clientSchemaId/llm-config
```

**Parameters:**
- `clientSchemaId` (path, required): The ID of the client schema

**Responses:**
- `200 OK`: Returns the LLM configuration
- `400 Bad Request`: If client schema ID is missing
- `404 Not Found`: If no LLM configuration is found
- `500 Internal Server Error`: For any server errors

### Update LLM Configuration

Updates the LLM configuration for a specific client schema.

```http
PUT /api/client-schemas/:clientSchemaId/llm-config
```

**Parameters:**
- `clientSchemaId` (path, required): The ID of the client schema

**Request Body:**
```json
{
  "llmId": 1
}
```

**Responses:**
- `200 OK`: Returns the updated LLM configuration
- `400 Bad Request`: If client schema ID or LLM ID is missing
- `404 Not Found`: If client schema or LLM is not found
- `500 Internal Server Error`: For any server errors

## Usage Example

### Frontend Service

```javascript
// Initialize the LLM service
await initializeLLMService(participantId, schema);

// Get the current LLM config
const config = getCurrentLLMConfig();

// Update the LLM configuration
const newConfig = await updateLLMConfig(newLLMId);
```

### Backend API Calls

```javascript
// Get LLM config
const response = await fetch(`/api/client-schemas/${clientSchemaId}/llm-config`);
const config = await response.json();

// Update LLM config
const updateResponse = await fetch(`/api/client-schemas/${clientSchemaId}/llm-config`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ llmId: newLLMId }),
});
const updatedConfig = await updateResponse.json();
```

## Testing

Run the test suite with:

```bash
npm test
```

Or run in watch mode:

```bash
npm run test:watch
```

## Error Handling

The module provides the following error handling:
- Returns appropriate HTTP status codes for different error scenarios
- Includes descriptive error messages in the response
- Logs detailed error information to the console for debugging

## Dependencies

- Express.js for the web server
- PostgreSQL for data storage
- Mocha/Chai for testing
