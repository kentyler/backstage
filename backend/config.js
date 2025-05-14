/**
 * Environment-aware configuration for authentication and CORS
 */
export default {
  // Client URL changes based on environment
  clientURL: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL || 'https://your-frontend-app.onrender.com'
    : 'http://localhost:3000',
  
  // Cookie settings - critical for cross-domain authentication
  cookieOptions: {
    // In development, cookies work on localhost without secure flag
    secure: process.env.NODE_ENV === 'production', 
    // For local development, 'lax' works best
    // For production with cross-domain, 'none' is needed (but requires secure:true)
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    // Path ensures cookies are sent for all routes
    path: '/'
  },
  
  // Session configuration
  sessionConfig: {
    secret: process.env.SESSION_SECRET || 'test-session-secret',
    resave: false,
    saveUninitialized: false,
    // Use default session name for simplicity and consistency
    name: 'connect.sid',
  }
};
