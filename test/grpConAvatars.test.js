// tests/grpConAvatars.test.js

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { pool } from '../src/db/connection.js';
import { 
  createGrpCon, 
  deleteGrpCon 
} from '../src/db/grpCons';
import {
  createGrpConAvatar,
  getGrpConAvatarsByConversation,
  deleteGrpConAvatar
} from '../src/db/grpConAvatars';

const TEST_GROUP_ID = 1;   // assuming a “test” group with ID=1 exists
const TEST_AVATAR_ID = 1;  // assuming an avatar with ID=1 exists

let convId;

/** Helper to clean up all avatars for a conversation + drop the conversation */
async function cleanupConversation(id) {
  // delete all avatar links
  await pool.query(
    `DELETE FROM grp_con_avatars
       WHERE grp_con_id = $1`,
    [id]
  );
  // then delete the conversation itself
  await deleteGrpCon(id);
}

describe('Group Conversation Avatars', () => {
  beforeEach(async () => {
    // spin up a fresh conversation for each test
    const conv = await createGrpCon(
      TEST_GROUP_ID,
      'test-conv-avatars',
      'Testing avatars'
    );
    convId = conv.id;
  });

  afterEach(async () => {
    // tear down conversation and any linked avatars
    await cleanupConversation(convId);
  });

  it('creates a conversation-avatar link', async () => {
    const row = await createGrpConAvatar(convId, TEST_AVATAR_ID);
    expect(row).toHaveProperty('grp_con_id', convId);
    expect(row).toHaveProperty('avatar_id', TEST_AVATAR_ID);
    // assuming your create returns an added_at timestamp
    expect(row).toHaveProperty('added_at');
  });

  it('lists avatars by conversation', async () => {
    // link two avatars
    await createGrpConAvatar(convId, TEST_AVATAR_ID);
    await createGrpConAvatar(convId, TEST_AVATAR_ID + 1); 
    const list = await getGrpConAvatarsByConversation(convId);
    // we should see at least those two entries
    const ids = list.map(r => r.avatar_id);
    expect(ids).toContain(TEST_AVATAR_ID);
    expect(ids).toContain(TEST_AVATAR_ID + 1);
  });

  it('deletes a conversation-avatar link', async () => {
    await createGrpConAvatar(convId, TEST_AVATAR_ID);
    const ok = await deleteGrpConAvatar(convId, TEST_AVATAR_ID);
    expect(ok).toBe(true);
    // now listing should no longer include TEST_AVATAR_ID
    const list = await getGrpConAvatarsByConversation(convId);
    expect(list.find(r => r.avatar_id === TEST_AVATAR_ID)).toBeUndefined();
  });
});
