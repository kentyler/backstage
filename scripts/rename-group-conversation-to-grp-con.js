/**
 * @file scripts/rename-group-conversation-to-grp-con.js
 * @description Helper script to identify files and code that need to be updated
 * when renaming from groupConversation to grpCon
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Files to rename (from -> to)
const directoriesToRename = [
  { from: 'src/db/groupConversationAvatars', to: 'src/db/grpConAvatars' },
  { from: 'src/db/groupConversationAvatarTurns', to: 'src/db/grpConAvatarTurns' },
  { from: 'src/db/groupConversationAvatarTurnRelationships', to: 'src/db/grpConAvatarTurnRelationships' },
  { from: 'src/db/groupConversations', to: 'src/db/grpConConversations' },
  { from: 'src/routes/groupConversationAvatars.js', to: 'src/routes/grpConAvatars.js' },
  { from: 'src/routes/groupConversationAvatarTurns.js', to: 'src/routes/grpConAvatarTurns.js' },
  { from: 'src/routes/groupConversationAvatarTurnRelationships.js', to: 'src/routes/grpConAvatarTurnRelationships.js' },
  { from: 'src/routes/groupConversations.js', to: 'src/routes/grpConConversations.js' },
  { from: 'test/groupConversation.test.js', to: 'test/grpConConversation.test.js' },
  { from: 'test/groupConversationAvatars.test.js', to: 'test/grpConAvatars.test.js' },
  { from: 'test/groupConversationAvatarTurns.test.js', to: 'test/grpConAvatarTurns.test.js' },
  { from: 'test/groupConversationAvatarTurnRelationships.test.js', to: 'test/grpConAvatarTurnRelationships.test.js' },
];

// Code replacements (from -> to)
const codeReplacements = [
  // Database table names in SQL queries
  { from: /public\.group_conversation_avatars/g, to: 'public.grp_con_avatars' },
  { from: /public\.group_conversation_avatar_turns/g, to: 'public.grp_con_avatar_turns' },
  { from: /public\.group_conversation_avatar_turn_relationships/g, to: 'public.grp_con_avatar_turn_relationships' },
  { from: /public\.group_conversations/g, to: 'public.grp_con_conversations' },
  
  // JavaScript variable and function names
  { from: /groupConversationAvatars/g, to: 'grpConAvatars' },
  { from: /groupConversationAvatarTurns/g, to: 'grpConAvatarTurns' },
  { from: /groupConversationAvatarTurnRelationships/g, to: 'grpConAvatarTurnRelationships' },
  { from: /groupConversations/g, to: 'grpConConversations' },
  { from: /GroupConversationAvatar/g, to: 'GrpConAvatar' },
  { from: /GroupConversationAvatarTurn/g, to: 'GrpConAvatarTurn' },
  { from: /GroupConversation/g, to: 'GrpCon' },
  
  // API routes
  { from: /\/api\/group-conversation-avatars/g, to: '/api/grp-con-avatars' },
  { from: /\/api\/group-conversation-avatar-turns/g, to: '/api/grp-con-avatar-turns' },
  { from: /\/api\/group-conversation-avatar-turn-relationships/g, to: '/api/grp-con-avatar-turn-relationships' },
  { from: /\/api\/group-conversations/g, to: '/api/grp-con-conversations' },
  
  // Import paths
  { from: /from '\.\.\/db\/groupConversationAvatars/g, to: "from '../db/grpConAvatars" },
  { from: /from '\.\.\/db\/groupConversationAvatarTurns/g, to: "from '../db/grpConAvatarTurns" },
  { from: /from '\.\.\/db\/groupConversationAvatarTurnRelationships/g, to: "from '../db/grpConAvatarTurnRelationships" },
  { from: /from '\.\.\/db\/groupConversations/g, to: "from '../db/grpConConversations" },
  { from: /from '\.\.\/routes\/groupConversationAvatars/g, to: "from '../routes/grpConAvatars" },
  { from: /from '\.\.\/routes\/groupConversationAvatarTurns/g, to: "from '../routes/grpConAvatarTurns" },
  { from: /from '\.\.\/routes\/groupConversationAvatarTurnRelationships/g, to: "from '../routes/grpConAvatarTurnRelationships" },
  { from: /from '\.\.\/routes\/groupConversations/g, to: "from '../routes/grpConConversations" },
];

/**
 * This script helps identify files that need to be renamed and code that needs to be updated.
 * It doesn't actually make the changes - it just provides guidance.
 * 
 * To use this script:
 * 1. Run it to see what files need to be renamed and what code needs to be updated
 * 2. Manually rename the directories and files
 * 3. Update the code in each file
 * 
 * Note: This is a complex change that affects many parts of the codebase.
 * It's recommended to make these changes incrementally and test thoroughly after each step.
 */

console.log('Files and directories to rename:');
directoriesToRename.forEach(({ from, to }) => {
  const fullFrom = path.join(rootDir, from);
  if (fs.existsSync(fullFrom)) {
    console.log(`  ${from} -> ${to}`);
  } else {
    console.log(`  [NOT FOUND] ${from}`);
  }
});

console.log('\nCode replacements to make:');
codeReplacements.forEach(({ from, to }) => {
  console.log(`  ${from} -> ${to}`);
});

console.log('\nThis script is a guide only. Please make the changes manually and test thoroughly.');