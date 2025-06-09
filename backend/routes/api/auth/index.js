/**
 * API routes for authentication
 * @module routes/api/auth
 */

import express from 'express';
import loginRouter from './login.js';
import logoutRouter from './logout.js';
import statusRouter from './status.js';
import testRouter from './test.js';
import { inviteParticipant, getInvitation, acceptInvitationEndpoint } from './invite.js';

const router = express.Router();

// Mount all authentication related routes
router.use(loginRouter);
router.use(logoutRouter);
router.use(statusRouter);
router.use(testRouter);

// Invitation routes
router.post('/invite', inviteParticipant);
router.get('/invite/:token', getInvitation);
router.post('/invite/:token/accept', acceptInvitationEndpoint);

export default router;
