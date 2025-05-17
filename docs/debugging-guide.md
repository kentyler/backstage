# Debugging Guide

## Database Query Debugging

### Recent Lessons Learned

We recently spent significant time debugging an LLM configuration issue that could have been resolved much faster with better debugging practices. The core issue was a mismatch between how we were trying to parse preference values (as JSON) versus how they were actually stored (as integers).

### Best Practices

1. **Log Data Types and Raw Values**
   ```javascript
   // Good
   const query = `
     SELECT some_field, 
            pg_typeof(some_field) as field_type
     FROM some_table`;
   console.log('Field details:', {
     value: result.rows[0]?.some_field,
     type: result.rows[0]?.field_type
   });

   // Bad
   console.log('Query result:', result);
   ```

2. **Structure Debug Logs**
   ```javascript
   // Good
   console.log('Query details:', {
     sql: query,
     params: [param1, param2],
     rowCount: result.rowCount,
     rows: result.rows
   });

   // Bad
   console.log('Running query with:', query, param1, param2);
   console.log('Got result:', result);
   ```

3. **Test Queries in Isolation**
   - Always test complex queries directly in the database first
   - Use database tools to verify data types and constraints
   - Check query plans for performance issues

4. **Add Schema Validation**
   ```javascript
   // Example schema validation
   function validatePreference(value, expectedType) {
     const actualType = typeof value;
     if (actualType !== expectedType) {
       throw new Error(
         `Invalid preference value type. Expected ${expectedType}, got ${actualType}`
       );
     }
   }
   ```

5. **Log Transformation Steps**
   ```javascript
   // Good
   function transformData(rawValue) {
     console.log('Starting transform:', { input: rawValue, type: typeof rawValue });
     const parsed = JSON.parse(rawValue);
     console.log('After parsing:', { value: parsed, type: typeof parsed });
     return parsed;
   }

   // Bad
   function transformData(rawValue) {
     return JSON.parse(rawValue);
   }
   ```

### Real-World Example

In our LLM configuration system, we improved debugging by:

1. Adding type checking with `pg_typeof()`:
   ```javascript
   SELECT preference_value, 
          pg_typeof(preference_value) as value_type
   FROM client_schema_preferences
   ```

2. Structuring logs to show the full context:
   ```javascript
   console.log('Client schema preference details:', {
     preferences: prefResult.rows,
     valueType: prefResult.rows[0]?.value_type,
     rawValue: prefResult.rows[0]?.preference_value
   });
   ```

3. Including query details in logs:
   ```javascript
   console.log('LLM query details:', {
     sql: query,
     params: [clientSchemaId, preferenceTypeId],
     rowCount: result.rowCount,
     rows: result.rows
   });
   ```

### Common Pitfalls to Avoid

1. **Assuming Data Types**
   - Always verify data types, especially when dealing with JSON or numeric fields
   - Use database type checking functions
   - Log raw values before parsing

2. **Generic Error Messages**
   - Include specific context in error messages
   - Log relevant data that led to the error
   - Use structured error objects with additional metadata

3. **Incomplete Logging**
   - Log both input and output of transformations
   - Include query parameters along with SQL
   - Show actual vs. expected values when validation fails

### Recommended Tools

1. **Database Tools**
   - pgAdmin or similar for direct query testing
   - Database schema visualization tools
   - Query plan analyzers

2. **Logging Tools**
   - Use structured logging (objects instead of strings)
   - Consider log aggregation tools
   - Implement log levels (debug, info, error)

3. **Development Tools**
   - Database migration tools with schema validation
   - TypeScript or similar for type checking
   - Automated testing tools

## Next Steps

1. Implement these debugging practices across all database-related code
2. Add schema validation for critical data structures
3. Create standard debug logging patterns for common operations
4. Document known type mismatches and their solutions
