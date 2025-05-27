/**
 * Event logging service for centralized tracking of participant events and system actions
 * @module services/eventLogger
 */

/**
 * Event categories
 * @enum {string}
 */
export const EVENT_CATEGORY = {
  SYSTEM: 'system',
  PARTICIPANT: 'participant',
  ERROR: 'error',
  SECURITY: 'security',
  PERFORMANCE: 'performance'
};

/**
 * Event types
 * @enum {number}
 */
export const EVENT_TYPE = {
  // System events
  STARTUP: 101,
  SHUTDOWN: 102,
  CONFIG_CHANGE: 103,
  
  // Participant events
  LOGIN: 1,           // Login successful
  LOGOUT: 4,          // Logout
  LOGIN_FAILED: 2,    // Login unsuccessful
  LOGIN_NOT_FOUND: 3, // Login attempt with non-existent email
  REGISTRATION: 5,
  TOPIC_SELECTION: 6,
  PREFERENCE_CHANGE: 7,
  FILE_UPLOAD_SUCCESS: 11,   // File upload successful
  FILE_UPLOAD_FAILURE: 12,   // File upload unsuccessful
  
  // Error events
  INFO: 201,
  WARNING: 202,
  ERROR: 203,
  CRITICAL_ERROR: 204,
  FRONTEND_ERROR: 205,
  
  // Security events
  AUTHENTICATION_SUCCESS: 301,
  AUTHENTICATION_FAILURE: 302,
  PERMISSION_DENIED: 303,
  
  // Performance events
  SLOW_QUERY: 401,
  HIGH_LATENCY: 402
};

/**
 * Log an event to the database
 * @param {Object} eventData - Event data to log
 * @param {string} eventData.schemaName - Database schema name
 * @param {string|number|null} eventData.participantId - ID of the participant (if applicable)
 * @param {string} eventData.eventType - Type of event from EVENT_TYPE enum
 * @param {string} eventData.eventCategory - Category of event from EVENT_CATEGORY enum
 * @param {string} eventData.description - Human-readable description of the event
 * @param {Object} [eventData.details={}] - Additional event details (will be stored as JSONB)
 * @param {string} [eventData.ipAddress] - IP address of the participant
 * @param {string} [eventData.userAgent] - User agent of the participant's browser
 * @param {Object} clientPool - Database client pool
 * @returns {Promise<Object>} Created event record
 */
export async function logEvent({
  schemaName,
  participantId,
  eventType,
  eventCategory,
  description,
  details = {},
  ipAddress,
  userAgent
}, clientPool) {
  console.log('==========================================');
  console.log('EVENT LOGGING FUNCTION CALLED with:', {
    schemaName, 
    participantId, 
    eventType,
    description
  });
  console.log('==========================================');
  console.log('Event logging attempt:', { 
    schemaName, participantId, eventType, description, 
    detailsType: typeof details, ipAddress, userAgent 
  });
  
  if (!clientPool) {
    console.error('ERROR: No client pool provided to logEvent');
    return {
      success: false,
      error: 'No client pool provided'
    };
  }
  
  try {
    console.log('==== EVENT LOGGING: Starting event log insert ====');
    console.log('Event log details:', { schemaName, participantId, eventType, description });
    
    // First verify if the participant_event_logs table exists
    try {
      const tableCheckResult = await clientPool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'participant_event_logs'
        )`
      );
      console.log('Table check result:', tableCheckResult.rows[0]);
      
      if (!tableCheckResult.rows[0].exists) {
        console.error('ERROR: participant_event_logs table does not exist');
        return {
          success: false,
          error: 'participant_event_logs table does not exist'
        };
      }
    } catch (tableCheckError) {
      console.error('Error checking for table existence:', tableCheckError);
    }
    
    // Validate schema name to prevent SQL injection
    const safeSchemaName = (schemaName || 'public').replace(/[^a-zA-Z0-9_-]/g, '');
    console.log('Setting schema path to:', safeSchemaName);
    
    // Use string interpolation for SET commands (they don't support parameterized queries)
    await clientPool.query(`SET search_path TO ${safeSchemaName}, public`);
    
    // Verify schemas table exists
    try {
      const schemasTableCheck = await clientPool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'schemas'
        )`
      );
      console.log('Schemas table check:', schemasTableCheck.rows[0]);
      
      if (!schemasTableCheck.rows[0].exists) {
        console.error('ERROR: public.schemas table does not exist, creating a direct insert');
        // Use a simpler direct insert without schema_id
        const directQuery = `
          INSERT INTO participant_event_logs(
            participant_id,
            event_type_id,
            description,
            details,
            ip_address,
            user_agent
          ) VALUES($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        
        const directValues = [
          participantId,
          eventType,
          description,
          details,
          ipAddress,
          userAgent
        ];
        
        console.log('Attempting direct insert with values:', directValues);
        const directResult = await clientPool.query(directQuery, directValues);
        console.log('Direct insert success:', directResult.rows[0]);
        return directResult.rows[0];
      }
    } catch (schemasCheckError) {
      console.error('Error checking for schemas table:', schemasCheckError);
    }
    
    // Get schema ID from schema name
    console.log('Querying for schema ID with name:', safeSchemaName);
    
    let schemaId;
    
    try {
      const schemaResult = await clientPool.query(
        'SELECT id FROM public.schemas WHERE name = $1',
        [safeSchemaName]
      );
      console.log('Schema query result:', schemaResult.rows);
      
      if (schemaResult.rows.length === 0) {
        console.error(`Schema '${safeSchemaName}' not found in the database`);
        // If schema not found, try to use a direct insert without schema ID
        console.log('Attempting fallback insert without schema_id...');
        
        const directQuery = `
          INSERT INTO participant_event_logs(
            participant_id,
            event_type_id,
            description,
            details,
            ip_address,
            user_agent
          ) VALUES($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        
        const directValues = [
          participantId,
          eventType,
          description,
          details,
          ipAddress,
          userAgent
        ];
        
        console.log('Attempting direct insert with values:', directValues);
        const directResult = await clientPool.query(directQuery, directValues);
        console.log('Direct insert success:', directResult.rows[0]);
        return directResult.rows[0];
      }
      
      schemaId = schemaResult.rows[0].id;
      console.log('Found schema ID:', schemaId);
    } catch (schemaError) {
      console.error('Error getting schema ID:', schemaError);
      throw schemaError;
    }
    
    // Now attempt the insert with schema_id
    const query = `
      INSERT INTO participant_event_logs(
        schema_id,
        participant_id,
        event_type_id,
        description,
        details,
        ip_address,
        user_agent
      ) VALUES($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      schemaId,
      participantId,
      eventType,
      description,
      details,
      ipAddress,
      userAgent
    ];
    
    console.log('Executing event log query with values:', values);
    const result = await clientPool.query(query, values);
    console.log('Event log insert success, returned:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error logging event:', error);
    console.error('Error details:', error.stack);
    // Still return some information even if logging fails
    return {
      success: false,
      error: error.message,
      eventType,
      eventCategory,
      description
    };
  }
}
