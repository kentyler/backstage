// tests/groupConversations.test.js

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { pool } from '../src/db/connection.js';
import {
  createGroupConversation,
  getGroupConversationById,
  getGroupConversationsByGroup,
  updateGroupConversation,
  deleteGroupConversation
} from '../src/db/groupConversations';

const testGroup = 1;
let convId;

describe('Group Conversation Functions', () => {
  beforeEach(async () => {
    await pool.query(
      "DELETE FROM public.group_conversations WHERE group_id = $1 AND name LIKE 'test-%'",
      [testGroup]
    );
    const conv = await createGroupConversation(testGroup, 'test-conv', 'desc');
    convId = conv.id;
  });

  afterEach(async () => {
    await pool.query('DELETE FROM public.group_conversations WHERE id = $1', [convId]);
  });

  it('creates a conversation', async () => {
    const c = await createGroupConversation(testGroup, 'test-2', 'desc2');
    expect(c).toHaveProperty('id');
    expect(c.group_id).toBe(testGroup);
    await pool.query('DELETE FROM public.group_conversations WHERE id = $1', [c.id]);
  });

  it('gets by ID', async () => {
    const c = await getGroupConversationById(convId);
    expect(c).not.toBeNull();
    expect(c.id).toBe(convId);
  });

  it('lists by group', async () => {
    const list = await getGroupConversationsByGroup(testGroup);
    expect(Array.isArray(list)).toBe(true);
    expect(list.some(x => x.id === convId)).toBe(true);
  });

  it('updates a conversation', async () => {
    const u = await updateGroupConversation(convId, 'updated', 'newdesc');
    expect(u.name).toBe('updated');
  });

  it('deletes the conversation', async () => {
    await deleteGroupConversation(convId);
    const c = await getGroupConversationById(convId);
    expect(c).toBeNull();
  });
});
