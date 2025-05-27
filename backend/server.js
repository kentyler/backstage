import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { Sequelize } from 'sequelize';
import SequelizeStore from 'connect-session-sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './db/index.js';
// Topic paths functions are now imported directly in the topicPaths router
import promptRoutes from './routes/api/promptProcessor.js';
import topicRoutes from './routes/api/topics/index.js';
import fileUploadRoutes from './routes/api/fileUploads.js';
import messagesRoutes from './routes/api/messages.js';
import llmConfigRoutes from './routes/api/llmConfig.js';
import authRoutes from './routes/api/auth.js';
import errorLoggingRoutes from './routes/api/errorLogging.js';
import eventsRoutes from './routes/api/events.js';
import commentsRoutes from './routes/api/comments.js';
// Removed conversation routes import as part of migration to topic-based architecture
import dotenv from 'dotenv';
import config from './config.js';
import fs from 'fs';

// Import middleware
import { setClientPool } from './middleware/setClientPool.js';
import requireClientPool from './middleware/requireClientPool.js';
import auth from './middleware/auth.js';

// Configure dotenv
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Configure CORS for all routes
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? false // No CORS needed in production since we serve frontend from same origin
    : ['http://localhost:3000'], // Allow React dev server in development
  credentials: true // Allow cookies
};
app.use(cors(corsOptions));

// Use the basic memory store to ensure server stability
const MemoryStore = session.MemoryStore;
const sessionStore = new MemoryStore();

console.log('Using standard in-memory session store');


// Configure session middleware with simplified settings for more reliable behavior
app.use(session({
  secret: process.env.SESSION_SECRET || 'test-session-secret',
  name: 'connect.sid',
  store: sessionStore,
  cookie: {
    path: '/',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    // In local development, secure:false works better
    secure: false,
    sameSite: 'lax'
  },
  // These settings ensure the session is saved immediately
  saveUninitialized: true,
  resave: true
}));

// Serve static files from React build folder
const staticPath = path.resolve(__dirname, '../frontend/build');
console.log('Serving static files from:', staticPath);

// Verify that build directory exists
if (fs.existsSync(staticPath)) {
  console.log('Build directory exists and is accessible');
  
  // Log the contents of the build directory
  const buildFiles = fs.readdirSync(staticPath);
  console.log('Build directory contents:', buildFiles);
} else {
  console.error('ERROR: Build directory does not exist at:', staticPath);
}

// Serve static files with detailed logging
app.use(express.static(staticPath, {
  setHeaders: (res, path) => {
    // Set caching headers appropriately
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// Add comprehensive request logging middleware to track all API requests
app.use((req, res, next) => {
  console.log(`======== REQUEST START ========`);
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  if (req.url.includes('logout')) {
    console.log('LOGOUT REQUEST DETECTED!');
    console.log('Session:', req.session);
    console.log('Body:', req.body);
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    // Add response logging for logout requests
    const originalSend = res.send;
    res.send = function(body) {
      console.log('LOGOUT RESPONSE:', body);
      return originalSend.call(this, body);
    };
  }
  
  console.log(`======== REQUEST END ========`);
  next();
});

// Apply setClientPool middleware to API routes and mount LLM routes
app.use('/api', setClientPool);

// Mount API routes after ensuring setClientPool is applied
app.use('/api/llm/prompt', requireClientPool, promptRoutes);

app.use('/api/topics', requireClientPool, topicRoutes);

app.use('/api/file-uploads', requireClientPool, fileUploadRoutes);

app.use('/api/messages', requireClientPool, messagesRoutes);

app.use('/api/client-schemas', requireClientPool, llmConfigRoutes);

app.use('/api/events', requireClientPool, eventsRoutes);

// Comments routes for handling message comments
app.use('/api/comments', requireClientPool, commentsRoutes);

// Auth routes for login, logout, and authentication status
app.use('/api/auth', requireClientPool, authRoutes);

// Authentication routes (login, logout, auth status) have been moved to routes/api/auth.js

// Import the groups router
import groupsRoutes from './routes/api/groups.js';

// Mount the groups router
app.use('/api/groups', requireClientPool, groupsRoutes);
// Import the topic paths and preferences routers
import topicPathsRoutes from './routes/api/topicPaths.js';
import preferencesRoutes from './routes/api/preferences.js';

// Mount the topic paths router
app.use('/api/topic-paths', requireClientPool, topicPathsRoutes);

// Mount the preferences router
app.use('/api/preferences', requireClientPool, preferencesRoutes);

// Mount the error logging routes - available to frontend without authentication
// to ensure errors can always be reported
app.use('/api/log', requireClientPool, errorLoggingRoutes);

// Authentication status and diagnostic routes have been moved to routes/api/auth.js

// Add endpoint to get current schema info - needed for frontend UI
app.get('/api/schema-info', (req, res) => {
  // Use the modular getSchemaFromRequest function
  const schema = db.getSchemaFromRequest(req);
  return res.status(200).json({ 
    schema: schema,
    hostname: req.hostname,
    message: `Using schema: ${schema}`
  });
});

// The '/api/conversations' endpoint has been removed as part of migration to topic-based architecture
// Frontend should use '/api/topics/:topicPathId/turns' or '/api/topics/path/:topicPathId' instead

// Database testing and query endpoints have been removed for security

// Log all requests to help debug static file serving
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// LLM Configuration Routes
app.use('/api/client-schemas', setClientPool, llmConfigRoutes);

// Catch-all route to serve React app for client-side routing
// This must come after all API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.url.startsWith('/api/')) {
    return next();
  }
  
  const indexPath = path.join(staticPath, 'index.html');
  console.log('Serving index.html from:', indexPath);
  
  // Check if index.html exists
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        res.status(500).send('Error loading application');
      }
    });
  } else {
    console.error('ERROR: index.html does not exist at:', indexPath);
    res.status(404).send('index.html not found. React build may be missing or incorrect.');
  }
});

// Import the session monitor
import SessionMonitor from './services/sessionMonitor.js';

// Initialize the session monitor once we have database pools available
let sessionMonitor = null;

// Function to initialize the session monitor when pools are available
const initializeSessionMonitor = () => {
  if (sessionMonitor) return; // Already initialized
  
  // Check if we have any pools
  const pools = Object.values(db.pools || {});
  if (pools.length === 0) {
    console.log('No database pools available yet, will try to initialize session monitor later');
    return;
  }
  
  // Get the first available pool
  const defaultPool = pools[0];
  
  // Create and start the session monitor
  sessionMonitor = new SessionMonitor(sessionStore, defaultPool, {
    checkInterval: 5 * 60 * 1000, // Check every 5 minutes
    inactivityThreshold: 30 * 60 * 1000 // Consider inactive after 30 minutes
  });
  
  sessionMonitor.start();
  console.log('Session monitor initialized and started');
};

// Try to initialize after a short delay to allow pools to be created
setTimeout(initializeSessionMonitor, 10000);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Serving React frontend and API from the same server');
  console.log('\nAPI endpoints:');
  console.log('- POST /api/auth/login - Login with any username/password');
  console.log('- POST /api/auth/logout - Logout');
  console.log('- GET /api/auth/status - Check authentication status');
  console.log('- GET /api/auth/test - Diagnostic info for deployment testing');
  console.log('- GET /api/groups - Get real groups from database (requires authentication)');
  console.log('- GET /api/schema-info - Get current schema information');
});

// Also try to initialize session monitor when a new connection is made
app.use((req, res, next) => {
  if (!sessionMonitor && req.clientPool) {
    initializeSessionMonitor();
  }
  next();
});

// Export the Express app and server for testing
export { app, server };
