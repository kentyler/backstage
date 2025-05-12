// Import dotenv to load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Import pg directly
import pg from 'pg';
const { Pool } = pg;

// Import vitest
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

// Import database functions
import {
  createGrpConAvatarTurn,
  getGrpConAvatarTurnById,
  updateGrpConAvatarTurn,
  deleteGrpConAvatarTurn
} from '../src/db/grpConAvatarTurns/index.js';

// Create a dedicated test pool with explicit schema
const testPool = new Pool({
  connectionString: process.env.DB_HOST,
  ssl: { rejectUnauthorized: false },
});

// Set the search path explicitly for all connections
testPool.on('connect', (client) => {
  client.query('SET search_path TO dev, public;');
});

// Helper function to create a test vector of 1536 dimensions
function createTestVector() {
  return Array(1536).fill(0.1);
}

describe('Group Conversation Avatar Turns', () => {
  let testGroupId;
  let convId;

  // Helper function to parse PostgreSQL vector string back to array
  function parseVector(vectorString) {
    if (!vectorString) return null;
    return vectorString
      .slice(1, -1) // Remove brackets
      .split(',')
      .map(Number);
  }

  beforeAll(async () => {
    // Create a test group
    const groupResult = await testPool.query(
      'INSERT INTO groups (name) VALUES ($1) RETURNING id',
      ['Test Group']
    );
    testGroupId = groupResult.rows[0].id;

    // Create a test conversation
    const convResult = await testPool.query(
      'INSERT INTO grp_cons (group_id, name, description, type_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [testGroupId, 'Test Conversation', 'Test Description', 1]
    );
    convId = convResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await testPool.query('DELETE FROM grp_con_avatar_turns WHERE grp_con_id = $1', [convId]);
    await testPool.query('DELETE FROM grp_cons WHERE id = $1', [convId]);
    await testPool.query('DELETE FROM groups WHERE id = $1', [testGroupId]);
    await testPool.end();
  });

  beforeEach(async () => {
    // Clean up any existing turns for this conversation
    await testPool.query('DELETE FROM grp_con_avatar_turns WHERE grp_con_id = $1', [convId]);
  });

  it('creates a turn', async () => {
    const result = await testPool.query(
      'INSERT INTO grp_con_avatar_turns (grp_con_id, avatar_id, turn_index, content_text, content_vector, turn_kind_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, grp_con_id, avatar_id, turn_index, content_text, content_vector',
      [convId, 1, 0, 'test-text', `[${createTestVector().join(',')}]`, 1]
    );
    const turn = result.rows[0];

    expect(turn).toHaveProperty('id');
    expect(Number(turn.grp_con_id)).toBe(Number(convId));
    expect(Number(turn.avatar_id)).toBe(1);
    expect(Number(turn.turn_index)).toBe(0);
    expect(turn.content_text).toBe('test-text');
    // PostgreSQL returns vector as string, so we need to parse it
    const parsedVector = parseVector(turn.content_vector);
    expect(Array.isArray(parsedVector)).toBe(true);
    expect(parsedVector.length).toBe(1536);
  });

  it('gets a turn by ID', async () => {
    // Create a test turn
    const insertResult = await testPool.query(
      'INSERT INTO grp_con_avatar_turns (grp_con_id, avatar_id, turn_index, content_text, content_vector, turn_kind_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [convId, 1, 0, 'test-text', `[${createTestVector().join(',')}]`, 1]
    );
    const turnId = insertResult.rows[0].id;
    
    // Get it back using the actual function
    const retrieved = await getGrpConAvatarTurnById(turnId, testPool);
    expect(retrieved).not.toBeNull();
    expect(Number(retrieved.id)).toBe(Number(turnId));
    expect(Number(retrieved.grp_con_id)).toBe(Number(convId));
    expect(Number(retrieved.avatar_id)).toBe(1);
    expect(Number(retrieved.turn_index)).toBe(0);
    expect(retrieved.content_text).toBe('test-text');
    // PostgreSQL returns vector as string, so we need to parse it
    const parsedVector = parseVector(retrieved.content_vector);
    expect(Array.isArray(parsedVector)).toBe(true);
    expect(parsedVector.length).toBe(1536);
  });

  it('gets turns by conversation', async () => {
    // Create multiple test turns
    await testPool.query(
      'INSERT INTO grp_con_avatar_turns (grp_con_id, avatar_id, turn_index, content_text, content_vector, turn_kind_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [convId, 1, 0, 'turn 1', `[${createTestVector().join(',')}]`, 1]
    );
    await testPool.query(
      'INSERT INTO grp_con_avatar_turns (grp_con_id, avatar_id, turn_index, content_text, content_vector, turn_kind_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [convId, 2, 1, 'turn 2', `[${createTestVector().join(',')}]`, 1]
    );

    // Get them back
    const result = await testPool.query(
      'SELECT id, grp_con_id, avatar_id, turn_index, content_text, content_vector FROM grp_con_avatar_turns WHERE grp_con_id = $1 ORDER BY turn_index',
      [convId]
    );
    const turns = result.rows;
    
    expect(Array.isArray(turns)).toBe(true);
    expect(turns.length).toBe(2);
    expect(Number(turns[0].turn_index)).toBe(0);
    expect(Number(turns[1].turn_index)).toBe(1);
    // Verify vectors for both turns
    const parsedVector1 = parseVector(turns[0].content_vector);
    const parsedVector2 = parseVector(turns[1].content_vector);
    expect(Array.isArray(parsedVector1)).toBe(true);
    expect(Array.isArray(parsedVector2)).toBe(true);
    expect(parsedVector1.length).toBe(1536);
    expect(parsedVector2.length).toBe(1536);
  });

  it('updates a turn', async () => {
    // Create a test turn
    const insertResult = await createGrpConAvatarTurn(
      convId,
      1,
      0,
      'old-text',
      `[${createTestVector().join(',')}]`,
      1,
      testPool
    );
    const turnId = insertResult.rows[0].id;
    
    // Update it using the actual function
    await updateGrpConAvatarTurn(
      turnId,
      { contentText: 'updated-text' },
      testPool
    );
    
    // Get it back
    const updated = await getGrpConAvatarTurnById(turnId, testPool);
    expect(updated).not.toBeNull();
    expect(updated.content_text).toBe('updated-text');
    // PostgreSQL returns vector as string, so we need to parse it
    const parsedVector = parseVector(updated.content_vector);
    expect(Array.isArray(parsedVector)).toBe(true);
    expect(parsedVector.length).toBe(1536);
  });

  it('deletes a turn', async () => {
    // Create a test turn
    const insertResult = await createGrpConAvatarTurn(
      convId,
      1,
      0,
      'test-text',
      `[${createTestVector().join(',')}]`,
      1,
      testPool
    );
    const turnId = insertResult.rows[0].id;
    
    // Delete it using the actual function
    await deleteGrpConAvatarTurn(turnId, testPool);
    
    // Try to get it back
    const deleted = await getGrpConAvatarTurnById(turnId, testPool);
    expect(deleted).toBeNull();
  });
});
