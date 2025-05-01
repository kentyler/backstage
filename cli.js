#!/usr/bin/env node

import minimist from 'minimist';
import axios from 'axios';

const argv = minimist(process.argv.slice(2));
const [ cmd ] = argv._;

const API = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: argv.token ? { Authorization: `Bearer ${argv.token}` } : undefined
});

/**
 * Create a new participant, but handle 409 conflict with a friendly message.
 */
async function createParticipantCmd() {
  const { name, email, password } = argv;
  if (!name || !email || !password) {
    console.error('Usage: cli.js create-participant --name NAME --email EMAIL --password PASSWORD');
    process.exit(1);
  }
  try {
    const res = await API.post('/participants', { name, email, password });
    console.log('✅ Participant created:', res.data);
  } catch (err) {
    if (err.response?.status === 409) {
      console.error(`⚠️  A participant with email "${email}" already exists.`);
      process.exit(1);
    }
    // Other errors:
    console.error('Error creating participant:', err.response?.data || err.message);
    process.exit(1);
  }
}

async function loginCmd() {
  const { email, password } = argv;
  if (!email || !password) {
    console.error('Usage: cli.js login --email EMAIL --password PASSWORD');
    process.exit(1);
  }
  try {
    const res = await API.post('/participants/login', { email, password });
    console.log('🔑 Logged in:', res.data);
  } catch (err) {
    console.error('Login failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

async function listParticipantsCmd() {
  try {
    const res = await API.get('/participants');
    console.table(res.data);
  } catch (err) {
    console.error('Error fetching participants:', err.response?.data || err.message);
    process.exit(1);
  }
}

async function whoamiCmd() {
  try {
    const res = await API.get('/participants/me');
    console.log('👤 You are:', res.data);
  } catch (err) {
    console.error('Error fetching current user:', err.response?.data || err.message);
    process.exit(1);
  }
}

(async () => {
  switch (cmd) {
    case 'create-participant':
      await createParticipantCmd();
      break;
    case 'login':
      await loginCmd();
      break;
    case 'list-participants':
      await listParticipantsCmd();
      break;
    case 'whoami':
      await whoamiCmd();
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      console.error('Available: create-participant, login, list-participants, whoami');
      process.exit(1);
  }
})();
