// src/app.js
import express from 'express';
import groupRoutes from './routes/groups.js';
import participantRoutes from './routes/participants.js';
import groupConversationRoutes       from './routes/groupConversations.js';
import groupConversationAvatarRoutes    from './routes/groupConversationAvatars.js';
import groupConversationAvatarTurnsRoutes from './routes/groupConversationAvatarTurns.js'
import groupConversationAvatarTurnRelationshipsRoutes from './routes/groupConversationAvatarTurnRelationships.js'

const app = express();
app.use(express.json());

// mount at /api/groups
app.use('/api/groups', groupRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/group-conversations',  groupConversationRoutes);
app.use('/api/group-conversation-avatars', groupConversationAvatarRoutes);
app.use('/api/group-conversation-avatar-turns', groupConversationAvatarTurnsRoutes)
app.use('/api/group-conversation-avatar-turn-relationships', groupConversationAvatarTurnRelationshipsRoutes)

// (you can add error‐handling middleware here)

export default app;