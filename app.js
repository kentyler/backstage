// app.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
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
app.use(session({
  secret: process.env.SESSION_SECRET || 'a-very-secure-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: useSecureCookies, // Use secure cookies when HTTPS is available
    sameSite: useSecureCookies ? 'strict' : 'lax' // Stricter when using HTTPS
  }
}));

// CSRF protection
app.use(generateCsrfSecret);
app.get('/api/csrf-token', generateCsrfToken, csrfTokenHandler);
app.use('/api', validateCsrfToken);

// Apply pool middleware globally
app.use(setClientPool);

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

// SPA fallback
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export default app;
