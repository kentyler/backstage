/**
 * Environment-aware configuration for authentication and CORS
 */
module.exports = {
  // Client URL changes based on environment
  clientURL: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL || 'https://your-frontend-app.onrender.com'
    : 'http://localhost:3000',
  
  // Cookie settings - critical for cross-domain authentication
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  // Session configuration
  sessionConfig: {
    secret: process.env.SESSION_SECRET || 'test-session-secret',
    resave: false,
    saveUninitialized: false,
    name: 'app.sid', // Custom name can help with cookie conflicts
  }
};
