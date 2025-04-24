// tests/group.test.js

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { pool } from '../src/db/connection.js';
import { createGroup } from '../src/db/groups/createGroup.js';
import { getGroupById } from '../src/db/groups/getGroupById.js';
import { getGroupByName } from '../src/db/groups/getGroupByName.js';
import { updateGroup } from '../src/db/groups/updateGroup.js';
import { deleteGroup } from '../src/db/groups/deleteGroup.js';

const testGroupName = 'test-data';
let testGroupId;

describe('Group Functions', () => {
  beforeEach(async () => {
    // Remove any existing test group by name
    await pool.query(
      'DELETE FROM public.groups WHERE name = $1',
      [testGroupName]
    );
    // Create new test group
    const group = await createGroup(testGroupName);
    testGroupId = group.id;
  });

  afterEach(async () => {
    // Clean up test group by ID
    await pool.query(
      'DELETE FROM public.groups WHERE id = $1',
      [testGroupId]
    );
  });

  it('should create a new group', async () => {
    const group = await createGroup('test-data');
    expect(group).toHaveProperty('id');
    expect(group.name).toBe('test-data');
  });

  it('should get group by ID', async () => {
    const group = await getGroupById(testGroupId);
    expect(group).not.toBeNull();
    expect(group.name).toBe(testGroupName);
  });

  it('should get group by name', async () => {
    const group = await getGroupByName(testGroupName);
    expect(group).not.toBeNull();
    expect(group.id).toBe(testGroupId);
  });

  it('should update group name', async () => {
    const updated = await updateGroup(testGroupId, 'test-data-updated');
    expect(updated).not.toBeNull();
    expect(updated.name).toBe('test-data-updated');
  });

  it('should delete the group', async () => {
    await deleteGroup(testGroupId);
    const group = await getGroupById(testGroupId);
    expect(group).toBeNull();
  });
});
