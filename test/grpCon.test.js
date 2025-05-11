// tests/grpCon.test.js

// Import dotenv to load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Import pg directly
import pg from 'pg';
const { Pool } = pg;

// Import vitest
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

// Create a dedicated test pool with explicit schema
const testPool = new Pool({
  connectionString: process.env.DB_HOST,
  ssl: { rejectUnauthorized: false },
});

// Set the search path explicitly for all connections
testPool.on('connect', (client) => {
  client.query('SET search_path TO dev, public;');
});

// Import the group functions for group setup/teardown
import { createGroup } from '../src/db/groups/createGroup.js';
import { deleteGroup } from '../src/db/groups/deleteGroup.js';

const testGroupName = 'test-data';
let testGroupId;
let convId;

describe('Group Conversation Functions', () => {
  beforeAll(async () => {
    // Create test group
    const result = await testPool.query(
      'INSERT INTO groups (name) VALUES ($1) RETURNING id',
      [testGroupName]
    );
    testGroupId = result.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test group
    await testPool.query('DELETE FROM groups WHERE id = $1', [testGroupId]);
    // Close the pool
    await testPool.end();
  });

  beforeEach(async () => {
    // Remove any existing test conversations for this group
    await testPool.query(
      "DELETE FROM grp_cons WHERE group_id = $1 AND name LIKE 'test-%'",
      [testGroupId]
    );
    // Create new test conversation
    const result = await testPool.query(
      'INSERT INTO grp_cons (group_id, name, description, type_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [testGroupId, 'test-conv', 'desc', 1]
    );
    convId = result.rows[0].id;
  });

  afterEach(async () => {
    // Clean up test conversation
    if (convId) {
      await testPool.query('DELETE FROM grp_cons WHERE id = $1', [convId]);
    }
  });

  it('creates a conversation', async () => {
    const result = await testPool.query(
      'INSERT INTO grp_cons (group_id, name, description, type_id) VALUES ($1, $2, $3, $4) RETURNING id, group_id, name, description, type_id',
      [testGroupId, 'test-2', 'desc2', 1]
    );
    const c = result.rows[0];
    expect(c).toHaveProperty('id');
    expect(c.group_id).toBe(testGroupId);
    await testPool.query('DELETE FROM grp_cons WHERE id = $1', [c.id]);
  });

  it('gets by ID', async () => {
    const result = await testPool.query(
      'SELECT id, group_id, name, description, type_id FROM grp_cons WHERE id = $1',
      [convId]
    );
    const c = result.rows[0];
    expect(c).not.toBeNull();
    expect(c.id).toBe(convId);
  });

  it('lists by group', async () => {
    const result = await testPool.query(
      'SELECT id, group_id, name, description, type_id FROM grp_cons WHERE group_id = $1',
      [testGroupId]
    );
    const list = result.rows;
    expect(Array.isArray(list)).toBe(true);
    expect(list.some(x => x.id === convId)).toBe(true);
  });

  it('updates a conversation', async () => {
    const result = await testPool.query(
      'UPDATE grp_cons SET name = $2, description = $3 WHERE id = $1 RETURNING id, name, description',
      [convId, 'updated', 'newdesc']
    );
    const u = result.rows[0];
    expect(u.name).toBe('updated');
  });

  it('deletes the conversation', async () => {
    await testPool.query('DELETE FROM grp_cons WHERE id = $1', [convId]);
    const result = await testPool.query(
      'SELECT id FROM grp_cons WHERE id = $1',
      [convId]
    );
    expect(result.rows.length).toBe(0);
    // Reset convId so afterEach doesn't try to delete it again
    convId = null;
  });
});
