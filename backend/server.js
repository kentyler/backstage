const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const config = require('./config');

// Import modular database functions
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Configure session middleware with environment-aware settings
app.use(session({
  ...config.sessionConfig,
  cookie: config.cookieOptions
}));

// Configure CORS with environment-aware settings - only for API routes
app.use('/api', cors({
  origin: config.clientURL,
  credentials: true // Allow cookies to be sent with requests
}));

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
  
  // For testing: any username/password combo works
  if (username && password) {
    // Set session
    req.session.userId = 1;
    req.session.username = username;
    
    return res.status(200).json({ 
      message: 'Logged in successfully',
      user: { id: 1, username }
    });
  }
  
  return res.status(400).json({ error: 'Invalid credentials' });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.clearCookie('connect.sid');
  return res.status(200).json({ message: 'Logged out successfully' });
});

// Protected API endpoints
app.get('/api/groups', authenticate, async (req, res) => {
  try {
    // Use the modular getAllGroups function which handles schema selection internally
    console.log('Fetching groups using modular function...');
    
    // Fetch groups from database instead of using hardcoded data
    const groups = await db.groups.getAllGroups(req);
    return res.status(200).json(groups);
  } catch (err) {
    console.error('Error fetching groups:', err);
    return res.status(500).json({ error: 'Failed to fetch groups', message: err.message });
  }
});

// Get a specific group by ID
app.get('/api/groups/:id', authenticate, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    
    if (isNaN(groupId)) {
      return res.status(400).json({ error: 'Invalid group ID' });
    }
    
    // Use the modular getGroupById function
    const group = await db.groups.getGroupById(groupId, req);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    return res.status(200).json(group);
  } catch (err) {
    console.error(`Error fetching group by ID:`, err);
    return res.status(500).json({ error: 'Failed to fetch group', message: err.message });
  }
});

// Check authentication status
app.get('/api/auth-status', (req, res) => {
  if (req.session.userId) {
    return res.status(200).json({ 
      authenticated: true, 
      user: { id: req.session.userId, username: req.session.username }
    });
  }
  return res.status(200).json({ authenticated: false });
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

// Add endpoint to get current schema info
app.get('/api/schema-info', authenticate, (req, res) => {
  // Use the modular getSchemaFromRequest function
  const schema = db.getSchemaFromRequest(req);
  return res.status(200).json({ 
    schema: schema,
    hostname: req.hostname,
    message: `Using schema: ${schema}`
  });
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

// Serve static files from React build folder
const staticPath = path.resolve(__dirname, '../frontend/build');
console.log('Serving static files from:', staticPath);

// Verify that build directory exists
const fs = require('fs');
if (fs.existsSync(staticPath)) {
  console.log('Build directory exists and is accessible');
  
  // Log the contents of the build directory
  const buildFiles = fs.readdirSync(staticPath);
  console.log('Build directory contents:', buildFiles);
} else {
  console.error('ERROR: Build directory does not exist at:', staticPath);
}

// Serve static files
app.use(express.static(staticPath));

// Catch-all route to serve React app for client-side routing
// This must come after all API routes
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  console.log('Serving index.html from:', indexPath);
  
  // Check if index.html exists
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
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
