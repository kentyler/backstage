/**
 * Session monitoring service to detect and log abandoned sessions
 */
import { logEvent, EVENT_TYPE } from './eventLogger.js';

/**
 * Creates a service that periodically checks for abandoned sessions
 * This complements the explicit logout route by handling cases where
 * users close their browser without logging out
 */
class SessionMonitor {
  constructor(store, pool, options = {}) {
    this.sessionStore = store;
    this.defaultPool = pool;
    this.checkInterval = options.checkInterval || 5 * 60 * 1000; // Default: check every 5 minutes
    this.inactivityThreshold = options.inactivityThreshold || 30 * 60 * 1000; // Default: 30 minutes inactivity
    this.knownActiveSessions = new Map(); // Map of session IDs to last active time
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * Start monitoring sessions
   */
  start() {
    if (this.isRunning) return;
    
    console.log(`Starting session monitor (check interval: ${this.checkInterval}ms, inactivity threshold: ${this.inactivityThreshold}ms)`);
    
    // Initial session scan
    this.scanSessions();
    
    // Set up periodic checks
    this.intervalId = setInterval(() => this.scanSessions(), this.checkInterval);
    this.isRunning = true;
  }

  /**
   * Stop monitoring sessions
   */
  stop() {
    if (!this.isRunning) return;
    
    clearInterval(this.intervalId);
    this.isRunning = false;
    console.log('Session monitor stopped');
  }

  /**
   * Scan all sessions and check for abandoned ones
   */
  scanSessions() {
    console.log('Scanning sessions for inactivity...');
    
    if (!this.sessionStore || typeof this.sessionStore.all !== 'function') {
      console.error('Session store does not support the "all" method');
      return;
    }
    
    const now = Date.now();
    
    // Get all current sessions
    this.sessionStore.all((err, sessions) => {
      if (err) {
        console.error('Error retrieving sessions:', err);
        return;
      }
      
      // Process each session
      const currentSessionIds = new Set();
      
      for (const [sid, sessionData] of Object.entries(sessions)) {
        currentSessionIds.add(sid);
        
        // Check if we're already tracking this session
        if (!this.knownActiveSessions.has(sid)) {
          // New session, add to tracking
          this.knownActiveSessions.set(sid, now);
        }
      }
      
      // Look for abandoned sessions (in our tracking but no longer in session store)
      for (const [sid, lastSeen] of this.knownActiveSessions.entries()) {
        if (!currentSessionIds.has(sid)) {
          // Session is gone, log it as abandoned if it had user data
          this.handleAbandonedSession(sid);
          this.knownActiveSessions.delete(sid);
        } else {
          // Session still exists, check for inactivity
          const session = sessions[sid];
          
          // Check if the session has a user and if it's been inactive too long
          if (session && session.userId && (now - lastSeen > this.inactivityThreshold)) {
            this.handleInactiveSession(session, sid);
            
            // Update last seen time to avoid repeated logging
            this.knownActiveSessions.set(sid, now);
          }
        }
      }
    });
  }

  /**
   * Handle a session that was found to be abandoned (no longer in store)
   */
  handleAbandonedSession(sid) {
    console.log(`Session abandoned: ${sid}`);
    // No action needed - we don't have the user data anymore
  }

  /**
   * Handle a session that exists but has been inactive for too long
   */
  handleInactiveSession(session, sid) {
    const userId = session.userId;
    const email = session.email || 'unknown';
    
    if (!userId) return;
    
    console.log(`Inactive session detected for user ${userId} (${email})`);
    
    // Log the event
    if (this.defaultPool) {
      logEvent({
        schemaName: 'public',
        participantId: userId,
        eventType: EVENT_TYPE.LOGOUT,
        description: `Session abandoned: ${email}`,
        details: { 
          email,
          method: 'browser_closure_detected',
          timestamp: new Date().toISOString()
        }
      }, this.defaultPool).catch(err => {
        console.error('Error logging abandoned session:', err);
      });
    }
  }
}

export default SessionMonitor;
