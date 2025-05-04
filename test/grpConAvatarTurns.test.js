// tests/grpConAvatarTurns.test.js

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { pool } from '../src/db/connection.js';

import {
  createGrpCon,
  deleteGrpCon
} from '../src/db/grpCons';
import {
  createGrpConAvatarTurn,
  getGrpConAvatarTurnById,
  getGrpConAvatarTurnsByConversation,
  updateGrpConAvatarTurn,
  deleteGrpConAvatarTurn
} from '../src/db/grpConAvatarTurns/index.js';


const testGroupId = 1; // existing 'test' group
let convId;

// Clean up leftover turns and conversations
async function cleanupConversation(id) {
  await pool.query(
    'DELETE FROM grp_con_avatar_turns WHERE grp_con_id = $1',
    [id]
  );
  await deleteGrpCon(id);
}

describe('Group Conversation Avatar Turns', () => {
  beforeEach(async () => {
    // Create a fresh conversation for each test
    const conv = await createGrpCon(testGroupId, 'test-conv', 'Initial');
    convId = conv.id;
  });

  afterEach(async () => {
    // Tear down conversation and its turns
    await cleanupConversation(convId);
  });

  it('creates a turn', async () => {
    const turn = await createGrpConAvatarTurn(convId, 1, 0, 'test-text', [0.1, 0.2]);
    expect(turn).toHaveProperty('id');
    expect(turn.grp_con_id).toBe(convId);
    expect(turn.avatar_id).toBe(1);
    expect(turn.turn_index).toBe(0);
    expect(turn.content_text).toBe('test-text');
    expect(Array.isArray(turn.content_vector)).toBe(true);
  });

  it('gets a turn by ID', async () => {
    const created = await createGrpConAvatarTurn(convId, 1, 1, 'get-text', [1, 2]);
    const fetched = await getGrpConAvatarTurnById(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(created.id);
  });

  it('lists turns by conversation', async () => {
    await createGrpConAvatarTurn(convId, 1, 0, 'first', [0]);
    await createGrpConAvatarTurn(convId, 2, 1, 'second', [1]);
    const list = await getGrpConAvatarTurnsByConversation(convId);
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.find(t => t.turn_index === 1).content_text).toBe('second');
  });

  it('updates a turn', async () => {
    const original = await createGrpConAvatarTurn(convId, 1, 2, 'orig', [2]);
    const updated = await updateGrpConAvatarTurn(original.id, 'new-text', [3]);
    expect(updated).not.toBeNull();
    expect(updated.content_text).toBe('new-text');
  });

  it('deletes a turn', async () => {
    const toDelete = await createGrpConAvatarTurn(convId, 1, 3, 'del-text', [3]);
    const result = await deleteGrpConAvatarTurn(toDelete.id);
    expect(result).toBe(true);
    const post = await getGrpConAvatarTurnById(toDelete.id);
    expect(post).toBeNull();
  });
});
