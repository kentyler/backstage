// app.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

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
import meRouter                         from './src/routes/me.js';
import { loginHandler }                 from './src/controllers/participants/loginHandler.js';

const app = express();
app.use(express.json());

// __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// serve your front-end
app.use(express.static(path.join(__dirname, 'public')));

// use cookies

app.use(cookieParser());

// API mounts
app.use('/api/groups', groupRoutes);
app.use('/api/participants', participantRoutes);
app.post('/api/participants/login', loginHandler);
app.use('/api/group-conversations',                         grpConRoutes);
app.use('/api/grp-con-avatars',                             grpConAvatarRoutes);
app.use('/api/group-conversation-avatar-turns',             grpConAvatarTurnsRoutes);
app.use('/api/conversations',                               conversationsRoutes);
app.use(
  '/api/grp-con-avatar-turn-relationships',
  grpConAvatarTurnRelationshipsRoutes
);
app.use('/api/participant-avatars',                         participantAvatarRoutes);
app.use('/api/participant-events',                          participantEventRoutes);
app.use('/api/preferences',                                 preferencesRoutes);

// mount the "who-ami" endpoint
app.use('/api/me', meRouter);

// SPA fallback
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export default app;
