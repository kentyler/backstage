// app.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
// PostgreSQL session store for better production reliability
import pgSession from 'connect-pg-simple';
import helmet from 'helmet';
import { 
  generateCsrfSecret, 
  generateCsrfToken, 
  validateCsrfToken,
  csrfTokenHandler 
} from './src/middleware/csrf.js';

import groupRoutes                      from './src/routes/groups.js';
import participantRoutes                from './src/routes/participants.js';
import grpConRoutes          from './src/routes/grpCons.js';
import grpConAvatarRoutes               from './src/routes/grpConAvatars.js';
import grpConAvatarTurnsRoutes from './src/routes/grpConAvatarTurns.js';
import grpConAvatarTurnRelationshipsRoutes 
  from './src/routes/grpConAvatarTurnRelationships.js';
import participantAvatarRoutes          from './src/routes/participantAvatars.js';
import participantEventRoutes           from './src/routes/participantEvents.js';
import conversationsRoutes              from './src/routes/conversations.js';
import preferencesRoutes                from './src/routes/preferences.js';
import grpConUploadsRoutes              from './src/routes/grpConUploads.js';
import grpConTemplateTopicsRoutes       from './src/routes/grpConTemplateTopics.js';
import meRouter                         from './src/routes/me.js';
import directAuthRouter                 from './src/routes/direct-auth.js';
import { loginHandler }                 from './src/controllers/participants/loginHandler.js';
import { setClientPool }                from './src/middleware/setClientPool.js';

const app = express();
app.use(express.json());

// Apply security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"]
    }
  },
  frameguard: {
    action: 'deny' // Explicitly set X-Frame-Options to DENY
  }
}));

// __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// serve your front-end
app.use(express.static(path.join(__dirname, 'public')));

// Import fs for synchronous file operations
import fs from 'fs';

// Detect if HTTPS is available (either in production or with local certificates)
const isHttpsEnabled = () => {
  // Always use secure cookies in production
  if (process.env.NODE_ENV === 'production') return true;
  
  // In development, check if SSL certificates exist
  try {
    const sslDir = path.join(__dirname, 'ssl');
    const keyPath = path.join(sslDir, 'key.pem');
    const certPath = path.join(sslDir, 'cert.pem');
    
    return fs.existsSync(keyPath) && fs.existsSync(certPath);
  } catch (error) {
    console.warn('Error checking for SSL certificates:', error.message);
    return false;
  }
};

// Check if we're running on localhost
const isLocalhost = process.env.NODE_ENV !== 'production' && 
                   (process.env.HOST === 'localhost' || 
                    process.env.HOSTNAME === 'localhost' ||
                    !process.env.HOST); // Default to assuming localhost in development

// Skip secure cookies for localhost unless explicitly enabled
const skipSecureForLocalhost = process.env.SKIP_SSL_FOR_LOCALHOST !== 'false';

// Determine if we should use secure cookies based on environment and HTTPS availability
const useSecureCookies = (process.env.NODE_ENV === 'production' || 
                         process.env.USE_HTTPS === 'true' ||
                         isHttpsEnabled()) && 
                         !(isLocalhost && skipSecureForLocalhost);

console.log(`Cookie security settings: useSecureCookies=${useSecureCookies}, isLocalhost=${isLocalhost}`);

// Configure cookies and sessions
app.use(cookieParser());

// Determine the proper cookie domain setting for session cookies
const getCookieDomain = (req) => {
  // Default to undefined (browser will use the current domain)
  let cookieDomain;
  
  // Get hostname from request
  const hostname = req.hostname || '';
  console.log(`[Session] Request hostname: ${hostname}`);
  
  // Skip domain setting for localhost
  if (hostname.includes('localhost') || hostname === '127.0.0.1') {
    console.log('[Session] Using default cookie domain for localhost');
    return undefined;
  }
  
  // For production with subdomains, use parent domain with leading dot
  // Example: for bsa.conversationalai.us, use .conversationalai.us
  const domainParts = hostname.split('.');
  if (domainParts.length >= 2) {
    // Get the top two levels of the domain (e.g., example.com)
    // For longer domains like sub.example.co.uk, this would need more logic
    const baseDomain = domainParts.slice(-2).join('.');
    // Prefix with a dot to include all subdomains
    cookieDomain = '.' + baseDomain;
    console.log(`[Session] Using cookie domain: ${cookieDomain} for cross-subdomain support`);
  }
  
  return cookieDomain;
};

// Initialize PostgreSQL session store
const PgStore = pgSession(session);

// Set up session configuration with options
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'a-very-secure-session-secret',
  resave: false, // Optimized for external session store
  saveUninitialized: false, // Don't create sessions until needed
  cookie: {
    httpOnly: true,
    secure: useSecureCookies, // Use secure cookies when HTTPS is available
    sameSite: useSecureCookies ? 'none' : 'lax', // Use 'none' with secure cookies for cross-domain
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  // Custom logic to set domain for cross-subdomain support
  proxy: true,
  name: 'bs_sessionid', // Custom name to avoid conflicts
  rolling: true, // Refresh session with each request
};

// Enhanced DB connection with error handling and fallback
try {
  // When in production, use PostgreSQL for sessions
  if (process.env.NODE_ENV === 'production') {
    // Get database connection parameters from environment, with fallbacks
    const pgConfig = {
      // Instead of conString, use the pool config approach which is more reliable
      pool: { 
        // The error was likely because the connection string was using 'postgresql' as a hostname
        // Instead, explicitly use the environment variables with proper fallbacks
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST, // This correctly uses the environment variable instead of hardcoded 'postgresql'
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME
      },
      tableName: 'session',
      createTableIfMissing: true
    };
    
    // Log connection info (without sensitive data)
    console.log(`[Session] PostgreSQL session store connecting to: ${process.env.DB_HOST}:${process.env.DB_PORT || 5432} as ${process.env.DB_USER}`);
    
    // Use PostgreSQL session store
    sessionConfig.store = new PgStore(pgConfig);
    console.log('[Session] Using PostgreSQL session store for production');
  } else {
    // Use memory store for non-production
    console.log('[Session] Using MemoryStore for development environment');
  }
} catch (error) {
  // Detailed error logging for connection issues
  console.error(`[Session] Error configuring PostgreSQL session store: ${error.message}`);
  console.error('[Session] Falling back to MemoryStore - WARNING: not suitable for production');
  
  // Continue with default MemoryStore if PostgreSQL store fails
}

// Apply the session middleware with our configuration
app.use(session(sessionConfig));

// Middleware to set cookie domain dynamically
app.use((req, res, next) => {
  if (req.session) {
    const cookieDomain = getCookieDomain(req);
    if (cookieDomain) {
      req.session.cookie.domain = cookieDomain;
      console.log(`[Session] Set cookie domain to ${cookieDomain} for session ${req.session.id?.substring(0, 8) || 'unknown'}`);
    }
  }
  next();
});

// Apply pool middleware globally FIRST - this needs to be available for all routes
app.use(setClientPool);

// CSRF protection
app.use(generateCsrfSecret);
app.get('/api/csrf-token', generateCsrfToken, csrfTokenHandler);

// Create a special CSRF-exempt route handler specifically for login
// that ensures the client pool is properly attached
app.post('/api/participants/login', async (req, res, next) => {
  console.log('[Login] Processing login request for hostname:', req.hostname);
  console.log('[Login] Request headers:', JSON.stringify(req.headers));
  
  // Forcibly determine the schema based on hostname for subdomains
  try {
    // Import needed modules
    const { determineSchemaFromHostname } = await import('./src/middleware/setClientSchema.js');
    const { createPool } = await import('./src/db/connection.js');
    
    // Determine schema normally - with participants table now in public schema,
    // we just need a valid connection pool for other operations (like logging events)
    const hostname = req.hostname;
    console.log(`[Login] Processing login for hostname: ${hostname}`);
    
    // Determine schema using the standard logic for this hostname
    // We don't need special case handling now that participants is in public schema
    const schema = determineSchemaFromHostname(hostname);
    console.log(`[Login] Using schema '${schema}' for hostname ${hostname}`);
    
    // Note that even though we get a schema-specific connection pool,
    // the participants table will be accessed from public schema
    // This gives us a valid DB connection while maintaining uniform auth
    
    if (!schema) {
      console.error(`[Login] Could not determine schema for hostname: ${hostname}`);
      return res.status(500).json({ 
        error: 'Database configuration error', 
        detail: `Could not determine database schema for hostname: ${hostname}`, 
        subdomain: hostname.split('.')[0] 
      });
    }
    
    // Create a fresh pool specifically for this login request
    console.log(`[Login] Creating connection pool for schema: ${schema}`);
    req.clientPool = createPool(schema);
    console.log(`[Login] Successfully created client pool for schema: ${schema}`);
  } catch (poolError) {
    console.error('[Login] Failed to create client pool:', poolError);
    return res.status(500).json({ 
      error: 'Database connection error', 
      detail: poolError.message, 
      stack: process.env.NODE_ENV !== 'production' ? poolError.stack : undefined 
    });
  }
  
  try {
    console.log('[Login] Calling login handler with schema:', req.clientPool?.options?.schema);
    await loginHandler(req, res, next);
  } catch (error) {
    console.error('[Login] Error during login process:', error);
    
    // Enhanced error response with more diagnostics
    res.status(500).json({ 
      error: 'Login process failed', 
      message: error.message,
      hostname: req.hostname,
      schema: req.clientPool?.options?.schema || 'unknown',
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      time: new Date().toISOString()
    });
  }
});

// Apply CSRF validation to other API endpoints
app.use('/api', validateCsrfToken);

// API mounts
app.use('/api/groups', groupRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/grp-cons',                                    grpConRoutes);
app.use('/api/grp-con-avatars',                             grpConAvatarRoutes);
app.use('/api/grp-con-avatar-turns',                        grpConAvatarTurnsRoutes);
app.use('/api/conversations',                               conversationsRoutes);
app.use(
  '/api/grp-con-avatar-turn-relationships',
  grpConAvatarTurnRelationshipsRoutes
);
app.use('/api/participant-avatars',                         participantAvatarRoutes);
app.use('/api/participant-events',                          participantEventRoutes);
app.use('/api/preferences',                                 preferencesRoutes);
app.use('/api/grp-con-uploads',                             grpConUploadsRoutes);
app.use('/api/grp-con-template-topics',                     grpConTemplateTopicsRoutes);

// mount the "who-ami" endpoint
app.use('/api/me', meRouter);

// Mount our CSRF-exempt direct authentication endpoint
// This is not protected by CSRF validation middleware
app.use('/api/direct-auth', directAuthRouter);

// SPA fallback
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export default app;
