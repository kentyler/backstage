// tests/grpCons.test.js

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { pool } from '../src/db/connection.js';
import {
  createGrpCon,
  getGrpConById,
  getGrpConsByGroup,
  updateGrpCon,
  deleteGrpCon
} from '../src/db/grpCons';

const testGroup = 1;
let convId;

describe('Group Conversation Functions', () => {
  beforeEach(async () => {
    await pool.query(
      "DELETE FROM grp_cons WHERE group_id = $1 AND name LIKE 'test-%'",
      [testGroup]
    );
    const conv = await createGrpCon(testGroup, 'test-conv', 'desc');
    convId = conv.id;
  });

  afterEach(async () => {
    await pool.query('DELETE FROM grp_cons WHERE id = $1', [convId]);
  });

  it('creates a conversation', async () => {
    const c = await createGrpCon(testGroup, 'test-2', 'desc2');
    expect(c).toHaveProperty('id');
    expect(c.group_id).toBe(testGroup);
    await pool.query('DELETE FROM grp_cons WHERE id = $1', [c.id]);
  });

  it('gets by ID', async () => {
    const c = await getGrpConById(convId);
    expect(c).not.toBeNull();
    expect(c.id).toBe(convId);
  });

  it('lists by group', async () => {
    const list = await getGrpConsByGroup(testGroup);
    expect(Array.isArray(list)).toBe(true);
    expect(list.some(x => x.id === convId)).toBe(true);
  });

  it('updates a conversation', async () => {
    const u = await updateGrpCon(convId, 'updated', 'newdesc');
    expect(u.name).toBe('updated');
  });

  it('deletes the conversation', async () => {
    await deleteGrpCon(convId);
    const c = await getGrpConById(convId);
    expect(c).toBeNull();
  });
});
