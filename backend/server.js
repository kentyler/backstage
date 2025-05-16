import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { Sequelize } from 'sequelize';
import SequelizeStore from 'connect-session-sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './db/index.js';
import { getTopicPaths, createTopicPath, deleteTopicPath, updateTopicPath } from './db/topic-paths/index.js';
import dotenv from 'dotenv';
import config from './config.js';
import fs from 'fs';

// Import the client pool middleware
import { setClientPool } from './middleware/setClientPool.js';

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

// Configure CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? false // No CORS needed in production since we serve frontend from same origin
    : ['http://localhost:3000'], // Allow React dev server in development
  credentials: true // Allow cookies
};
app.use(cors(corsOptions));

// Create an in-memory store for now - simplest solution for testing
// Will be replaced with the database store once the basic authentication flow is working
const MemoryStore = session.MemoryStore;
const sessionStore = new MemoryStore();

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

// Configure CORS with environment-aware settings - only for API routes
app.use('/api', cors({
  origin: config.clientURL,
  credentials: true // Allow cookies to be sent with requests
}));

// Apply setClientPool middleware to all API routes
// This will determine the schema and create a pool for each client
app.use('/api', setClientPool);

// Simple authentication middleware
const authenticate = (req, res, next) => {
  // For testing: consider the user authenticated if they have a session
  if (req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
};

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt for:', username);
  
  // For testing: any username/password combo works
  if (username && password) {
    // Set session values directly
    req.session.userId = 1;
    req.session.username = username;
    req.session.authenticated = true;
    
    // Log the session details
    console.log('Session created:', {
      sessionID: req.sessionID,
      session: req.session
    });
    
    // Force immediate session save
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session save failed', details: err.message });
      }
      
      console.log('Session saved successfully');
      
      // Set cookie explicitly to ensure it's sent
      res.cookie('connect.sid', req.sessionID, {
        path: '/',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        secure: false,
        sameSite: 'lax'
      });
      
      return res.status(200).json({
        message: 'Logged in successfully',
        user: { id: 1, username },
        sessionID: req.sessionID,
        authenticated: true
      });
    });
  } else {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  const sessionName = config.sessionConfig.name || 'connect.sid';
  console.log(`Logging out user, clearing session cookie: ${sessionName}`);
  
  req.session.destroy(err => {
    if (err) {
      console.error('Session destroy error:', err);
    }
    
    // Clear the cookie with the same settings used to set it
    res.clearCookie(sessionName, {
      path: '/',
      httpOnly: true,
      secure: config.cookieOptions.secure,
      sameSite: config.cookieOptions.sameSite
    });
    
    return res.status(200).json({ message: 'Logged out successfully' });
  });
});

// Import the group functions directly
import { getAllGroups, getGroupById } from './db/groups/index.js';

// Protected API endpoints
app.get('/api/groups', authenticate, async (req, res) => {
  try {
    console.log('Fetching groups from actual database...');
    
    // Check if clientPool is available
    if (!req.clientPool) {
      console.error('Database connection pool not available');
      return res.status(500).json({ 
        error: 'Database connection not available',
        message: 'The application is unable to access the database.'
      });
    }
    
    // Use the imported getAllGroups function with the client pool
    // This follows the pattern from the previous implementation
    const groups = await getAllGroups(req.clientPool);
    
    // Log the result for debugging
    console.log(`Found ${groups.length} groups`);
    
    return res.status(200).json(groups);
  } catch (err) {
    console.error('Error fetching groups:', err);
    // Return empty array instead of error to prevent UI crashes (as in previous impl)
    return res.json([]);
  }
});

// Get a specific group by ID
app.get('/api/groups/:id', authenticate, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    
    if (isNaN(groupId)) {
      return res.status(400).json({ error: 'Invalid group ID' });
    }
    
    // Check if clientPool is available
    if (!req.clientPool) {
      console.error('Database connection pool not available');
      return res.status(500).json({ 
        error: 'Database connection not available',
        message: 'The application is unable to access the database.'
      });
    }
    
    console.log(`Fetching group ID ${groupId}...`);
    
    // Use the imported getGroupById function with client pool
    const group = await getGroupById(groupId, req.clientPool);
    
    // Check if a group was found
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    return res.status(200).json(group);
  } catch (err) {
    console.error(`Error fetching group by ID:`, err);
    return res.status(500).json({ error: 'Failed to fetch group', message: err.message });
  }
});

// Check authentication status with enhanced debugging
// Topic paths endpoints
// Delete a topic path
// Update a topic path
app.put('/api/topic-paths/:path', authenticate, async (req, res) => {
  try {
    const oldPath = decodeURIComponent(req.params.path);
    const { newPath } = req.body;
    await updateTopicPath(req.clientPool, oldPath, newPath);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating topic path:', error);
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/topic-paths/:path', authenticate, async (req, res) => {
  try {
    const path = decodeURIComponent(req.params.path);
    await deleteTopicPath(req.clientPool, path);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting topic path:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/topic-paths', authenticate, async (req, res) => {
  try {
    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    const newPath = await createTopicPath(path, req.session.userId, req.clientPool);
    res.json(newPath);
  } catch (error) {
    console.error('Error creating topic path:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Path already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create topic path' });
    }
  }
});

// Get topic paths
app.get('/api/topic-paths', authenticate, async (req, res) => {
  try {
    const paths = await getTopicPaths(req.clientPool);
    res.json(paths);
  } catch (error) {
    console.error('Error fetching topic paths:', error);
    res.status(500).json({ error: 'Failed to fetch topic paths' });
  }
});

app.get('/api/auth-status', (req, res) => {
  console.log('Auth status check:', { 
    sessionID: req.sessionID,
    hasSession: !!req.session,
    sessionData: req.session,
    authenticated: req.session?.authenticated,
    userId: req.session?.userId
  });
  
  // First check if we have explicitly set the authenticated flag
  if (req.session && req.session.authenticated) {
    console.log('User is authenticated via authenticated flag');
    const schema = db.getSchemaFromRequest(req);
    return res.status(200).json({ 
      authenticated: true, 
      user: { id: req.session.userId, username: req.session.username, schema: schema },
      sessionID: req.sessionID
    });
  }
  
  // Fallback check if we have userId but not the authenticated flag
  if (req.session && req.session.userId) {
    console.log('User is authenticated via userId');
    // Set the authenticated flag for future checks
    req.session.authenticated = true;
    const schema = db.getSchemaFromRequest(req);
    return res.status(200).json({ 
      authenticated: true, 
      user: { id: req.session.userId, username: req.session.username, schema: schema },
      sessionID: req.sessionID
    });
  }
  
  // If not authenticated, return more debug info
  console.log('User is not authenticated');
  return res.status(200).json({ 
    authenticated: false,
    sessionPresent: !!req.session,
    sessionID: req.sessionID || 'none',
    sessionKeys: req.session ? Object.keys(req.session) : []
  });
});

// Add diagnostic endpoint for deployment testing
app.get('/api/auth-test', (req, res) => {
  return res.status(200).json({
    environment: process.env.NODE_ENV || 'development',
    corsOrigin: config.clientURL,
    cookieConfig: config.cookieOptions,
    sessionActive: !!req.session.userId,
    sessionData: req.session,
    headers: req.headers,
    cookies: req.cookies
  });
});

// Add endpoint to get current schema info - no auth required since schema is determined by hostname
app.get('/api/schema-info', (req, res) => {
  // Use the modular getSchemaFromRequest function
  const schema = db.getSchemaFromRequest(req);
  return res.status(200).json({ 
    schema: schema,
    hostname: req.hostname,
    message: `Using schema: ${schema}`
  });
});

// Get conversations for a specific group - DIRECT SQL QUERY VERSION
app.get('/api/conversations', authenticate, async (req, res) => {
  console.log('------------------- /api/conversations endpoint called -------------------');
  let client = null;
  
  try {
    // Get the schema for this request
    const schema = db.getSchemaFromRequest(req);
    console.log(`Using schema: ${schema}`);
    
    // Get a client from the pool
    client = await db.pool.connect();
    
    // Set the search_path for this connection
    await client.query(`SET search_path TO ${schema}, public;`);
    console.log(`Search path set to ${schema}, public`);
    
    // Get group ID from query parameter
    let groupId = req.query.group_id;
    console.log(`Raw group_id from query: ${groupId}`);
    
    // Parse groupId as integer if provided
    if (groupId) {
      groupId = parseInt(groupId, 10);
      console.log(`Parsed group_id: ${groupId}`);
      
      // Check if parsing was successful
      if (isNaN(groupId)) {
        return res.status(400).json({ error: 'Invalid group ID format' });
      }
    } else {
      console.log(`No group_id provided, finding default group`);
      // If no group ID is provided, get the first group ID
      const groupsResult = await client.query('SELECT id FROM groups LIMIT 1');
      console.log(`Found groups:`, groupsResult.rows);
      
      if (!groupsResult.rows.length) {
        console.log(`No groups found in database`);
        return res.status(404).json({ error: 'No groups found in database' });
      }
      
      groupId = groupsResult.rows[0].id;
      console.log(`Using first group with ID: ${groupId}`);
    }
    
    console.log(`Executing direct SQL query for conversations with group ID: ${groupId}`);
    
    // Execute a direct SQL query instead of using the helper function
    const query = `
      SELECT id, group_id, name, description, type_id, created_at
      FROM grp_cons
      WHERE group_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    console.log('SQL Query:', query.trim());
    console.log('Query parameters:', [groupId]);
    
    // Execute query directly
    const result = await client.query(query, [groupId]);
    console.log(`Query executed successfully. Fetched ${result.rows.length} conversations.`);
    
    // Return the conversations, even if it's an empty array
    return res.status(200).json(result.rows);
    
  } catch (err) {
    console.error('Error in conversations endpoint:', err);
    return res.status(500).json({ 
      error: 'Failed to fetch conversations', 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
      console.log('Database client released');
    }
  }
});

// Database test endpoints
app.get('/api/db-test', async (req, res) => {
  try {
    // Using the modular testConnection function
    const connectionTest = await db.testConnection(req);
    res.status(connectionTest.success ? 200 : 500).json(connectionTest);
  } catch (err) {
    console.error('Database test error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get database tables information 
app.get('/api/db-tables', authenticate, async (req, res) => {
  try {
    // Using the modular getTableInfo function with request for schema selection
    const tableInfo = await db.getTableInfo(req);
    res.status(tableInfo.success ? 200 : 500).json(tableInfo);
  } catch (err) {
    console.error('Error fetching table info:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Simple query endpoint
app.post('/api/db-query', authenticate, async (req, res) => {
  try {
    const { query: sqlQuery } = req.body;
    
    // Very basic security check - only allow SELECT statements
    if (!sqlQuery.trim().toLowerCase().startsWith('select')) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only SELECT queries are allowed' 
      });
    }
    
    // Using the modular query function with request for schema selection
    const result = await db.query(sqlQuery, [], req);
    const schema = db.getSchemaFromRequest(req);
    
    res.status(200).json({ 
      success: true, 
      schema: schema,
      result: result 
    });
  } catch (err) {
    console.error('Query execution error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Log all requests to help debug static file serving
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

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

// Start server
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
  console.log('Serving React frontend and API from the same server');
  console.log('\nAPI endpoints:');
  console.log('- POST /api/login - Login with any username/password');
  console.log('- POST /api/logout - Logout');
  console.log('- GET /api/groups - Get real groups from database (requires authentication)');
  console.log('- GET /api/auth-status - Check authentication status');
  console.log('- GET /api/auth-test - Diagnostic info for deployment testing');
  console.log('- GET /api/schema-info - Get current schema information');
  console.log('\nDatabase endpoints:');
  console.log('- GET /api/db-test - Test database connection');
  console.log('- GET /api/db-tables - List database tables (requires authentication)');
  console.log('- POST /api/db-query - Execute a SELECT query (requires authentication)');
});
