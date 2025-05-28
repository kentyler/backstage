# Database Error Handling Guide

## Overview

This directory contains utilities for consistent error handling in database operations. The key utility is `dbError.js`, which provides functions for creating standardized database errors that can be easily translated to ApiErrors in route handlers.

## Proper Error Handling Pattern

### 1. In Database Layer

Database functions should use the `createDbError` function to create standardized errors:

```javascript
import { createDbError, DB_ERROR_CODES } from '../utils/dbError.js';

export async function getRecordById(pool, id) {
  try {
    const result = await pool.query('SELECT * FROM records WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      throw createDbError(`Record with ID ${id} not found`, {
        code: DB_ERROR_CODES.RECORD_NOT_FOUND.code,
        status: DB_ERROR_CODES.RECORD_NOT_FOUND.status,
        context: { id }
      });
    }
    
    return result.rows[0];
  } catch (error) {
    // If it's already a db error, just add additional context and rethrow
    if (error.isDbError) {
      error.context = { ...error.context, operation: 'getRecordById' };
      throw error;
    }
    
    // Otherwise, wrap the original error
    throw createDbError('Database error while retrieving record', {
      code: DB_ERROR_CODES.QUERY_ERROR.code,
      status: DB_ERROR_CODES.QUERY_ERROR.status,
      context: { id, operation: 'getRecordById' },
      cause: error
    });
  }
}
```

### 2. In Route Handlers

Route handlers should translate database errors to ApiErrors:

```javascript
import { ApiError } from '../../middleware/errorHandler.js';

router.get('/records/:id', async (req, res, next) => {
  try {
    const record = await getRecordById(req.clientPool, req.params.id);
    res.json(record);
  } catch (error) {
    // Translate database error to API error
    if (error.isDbError) {
      return next(new ApiError(
        error.message,
        error.status,
        { cause: error, context: error.context }
      ));
    }
    
    // Handle other errors
    return next(new ApiError('Failed to retrieve record', 500, { cause: error }));
  }
});
```

## Error Code Standards

Use the predefined error codes in `DB_ERROR_CODES` for consistency:

- `RECORD_NOT_FOUND`: When a requested record doesn't exist (404)
- `VALIDATION_ERROR`: When input data is invalid (400)
- `DUPLICATE_RECORD`: When attempting to create a duplicate record (409)
- `QUERY_ERROR`: For general database query execution errors (500)

See `dbError.js` for the complete list of standardized error codes.

## Best Practices

1. **Be specific with error messages** - Include identifiers in error messages
2. **Include context** - Add relevant parameters to the error context
3. **Preserve original errors** - Use the `cause` parameter to maintain the error chain
4. **Use standard codes** - Stick to the predefined error codes for consistency
5. **Log appropriately** - Ensure proper error logging before throwing

This approach ensures database errors are handled consistently while maintaining separation of concerns between the database layer and HTTP/API layer.
