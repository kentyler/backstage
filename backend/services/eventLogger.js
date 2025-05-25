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
 * @enum {string}
 */
export const EVENT_TYPE = {
  // System events
  STARTUP: 'startup',
  SHUTDOWN: 'shutdown',
  CONFIG_CHANGE: 'config_change',
  
  // Participant events
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTRATION: 'registration',
  TOPIC_SELECTION: 'topic_selection',
  PREFERENCE_CHANGE: 'preference_change',
  
  // Error events
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL_ERROR: 'critical_error',
  FRONTEND_ERROR: 'frontend_error',
  
  // Security events
  AUTHENTICATION_SUCCESS: 'auth_success',
  AUTHENTICATION_FAILURE: 'auth_failure',
  PERMISSION_DENIED: 'permission_denied',
  
  // Performance events
  SLOW_QUERY: 'slow_query',
  HIGH_LATENCY: 'high_latency'
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
  const client = await clientPool.connect();
  
  try {
    await client.query('SET search_path TO $1, public', [schemaName]);
    
    const query = `
      INSERT INTO participant_event_logs(
        participant_id,
        event_type,
        event_category,
        description,
        details,
        ip_address,
        user_agent
      ) VALUES($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      participantId,
      eventType,
      eventCategory,
      description,
      details,
      ipAddress,
      userAgent
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error logging event:', error);
    // Still return some information even if logging fails
    return {
      success: false,
      error: error.message,
      eventType,
      eventCategory,
      description
    };
  } finally {
    client.release();
  }
}
