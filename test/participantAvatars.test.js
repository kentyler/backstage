// tests/participantAvatars.test.js

// Import test setup to ensure correct schema
import './setup.js';

// Import dotenv to load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Import pg directly
import pg from 'pg';
const { Pool } = pg;

// Import vitest
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

// Import the functions to test
import {
  createParticipantAvatar,
  getParticipantAvatarById,
  getParticipantAvatarsByParticipant,
  getParticipantAvatarsByAvatar,
  deleteParticipantAvatar
} from '../src/db/participantAvatars/index.js';

// Create a dedicated test pool with explicit schema
const testPool = new Pool({
  connectionString: process.env.DB_HOST,
  ssl: { rejectUnauthorized: false },
});

// Set the search path explicitly for all connections
testPool.on('connect', (client) => {
  client.query('SET search_path TO dev, public;');
});

// Global afterAll to close the pool after all tests
afterAll(async () => {
  await testPool.end();
});

// Make sure to set the schema before running tests
beforeAll(async () => {
  await testPool.query('SET search_path TO dev, public;');
});

// Test suite for direct SQL operations
describe('Participant Avatars - SQL Operations', () => {
  let testParticipantId;
  let testAvatarId;
  let createdByParticipantId;
  
  beforeAll(async () => {
    // Create test participant
    const participantResult = await testPool.query(
      'INSERT INTO participants (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      ['Test Participant', 'test-participant@example.com', 'test-password']
    );
    testParticipantId = participantResult.rows[0].id;
    
    // Create another participant to be the creator
    const creatorResult = await testPool.query(
      'INSERT INTO participants (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      ['Creator Participant', 'creator-participant@example.com', 'creator-password']
    );
    createdByParticipantId = creatorResult.rows[0].id;
    
    // Create test avatar
    const avatarResult = await testPool.query(
      'INSERT INTO avatars (name, instruction_set, avatar_scope_id, llm_config) VALUES ($1, $2, $3, $4) RETURNING id',
      ['Test Avatar', 'Test Instruction Set', 1, '{}']
    );
    testAvatarId = avatarResult.rows[0].id;
  });
  
  afterAll(async () => {
    // Clean up test data
    await testPool.query('DELETE FROM participant_avatars WHERE participant_id = $1', [testParticipantId]);
    await testPool.query('DELETE FROM participant_avatars WHERE created_by_participant_id = $1', [createdByParticipantId]);
    await testPool.query('DELETE FROM participants WHERE id = $1', [testParticipantId]);
    await testPool.query('DELETE FROM participants WHERE id = $1', [createdByParticipantId]);
    await testPool.query('DELETE FROM avatars WHERE id = $1', [testAvatarId]);
  });
  
  beforeEach(async () => {
    // Clean up any existing relationships for this test
    await testPool.query('DELETE FROM participant_avatars WHERE participant_id = $1', [testParticipantId]);
  });
  
  it('creates a participant-avatar relationship', async () => {
    const result = await testPool.query(
      'INSERT INTO participant_avatars (participant_id, avatar_id, created_by_participant_id) VALUES ($1, $2, $3) RETURNING id, participant_id, avatar_id, created_by_participant_id',
      [testParticipantId, testAvatarId, createdByParticipantId]
    );
    const relationship = result.rows[0];
    
    expect(relationship).toHaveProperty('id');
    expect(Number(relationship.participant_id)).toBe(Number(testParticipantId));
    expect(Number(relationship.avatar_id)).toBe(Number(testAvatarId));
    expect(Number(relationship.created_by_participant_id)).toBe(Number(createdByParticipantId));
  });
  
  it('gets a participant-avatar relationship by ID', async () => {
    // Create a relationship first
    const createResult = await testPool.query(
      'INSERT INTO participant_avatars (participant_id, avatar_id, created_by_participant_id) VALUES ($1, $2, $3) RETURNING id',
      [testParticipantId, testAvatarId, createdByParticipantId]
    );
    const relationshipId = createResult.rows[0].id;
    
    // Get it back
    const getResult = await testPool.query(
      'SELECT id, participant_id, avatar_id, created_by_participant_id FROM participant_avatars WHERE id = $1',
      [relationshipId]
    );
    const relationship = getResult.rows[0];
    
    expect(relationship).toHaveProperty('id');
    expect(Number(relationship.id)).toBe(Number(relationshipId));
    expect(Number(relationship.participant_id)).toBe(Number(testParticipantId));
    expect(Number(relationship.avatar_id)).toBe(Number(testAvatarId));
  });
  
  it('gets participant-avatar relationships by participant', async () => {
    // Create multiple relationships
    await testPool.query(
      'INSERT INTO participant_avatars (participant_id, avatar_id, created_by_participant_id) VALUES ($1, $2, $3)',
      [testParticipantId, testAvatarId, createdByParticipantId]
    );
    
    // Create another avatar for this test
    const anotherAvatarResult = await testPool.query(
      'INSERT INTO avatars (name, instruction_set, avatar_scope_id, llm_config) VALUES ($1, $2, $3, $4) RETURNING id',
      ['Another Test Avatar', 'Another Instruction Set', 1, '{}']
    );
    const anotherAvatarId = anotherAvatarResult.rows[0].id;
    
    await testPool.query(
      'INSERT INTO participant_avatars (participant_id, avatar_id, created_by_participant_id) VALUES ($1, $2, $3)',
      [testParticipantId, anotherAvatarId, createdByParticipantId]
    );
    
    // Get them back
    const result = await testPool.query(
      'SELECT id, participant_id, avatar_id FROM participant_avatars WHERE participant_id = $1 ORDER BY created_at DESC',
      [testParticipantId]
    );
    const relationships = result.rows;
    
    expect(Array.isArray(relationships)).toBe(true);
    expect(relationships.length).toBe(2);
    expect(Number(relationships[0].participant_id)).toBe(Number(testParticipantId));
    expect(Number(relationships[1].participant_id)).toBe(Number(testParticipantId));
    
    // Clean up the additional avatar
    await testPool.query('DELETE FROM participant_avatars WHERE avatar_id = $1', [anotherAvatarId]);
    await testPool.query('DELETE FROM avatars WHERE id = $1', [anotherAvatarId]);
  });
  
  it('gets participant-avatar relationships by avatar', async () => {
    // Create multiple relationships
    await testPool.query(
      'INSERT INTO participant_avatars (participant_id, avatar_id, created_by_participant_id) VALUES ($1, $2, $3)',
      [testParticipantId, testAvatarId, createdByParticipantId]
    );
    
    // Create another participant for this test
    const anotherParticipantResult = await testPool.query(
      'INSERT INTO participants (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      ['Another Test Participant', 'another-test-participant@example.com', 'another-test-password']
    );
    const anotherParticipantId = anotherParticipantResult.rows[0].id;
    
    await testPool.query(
      'INSERT INTO participant_avatars (participant_id, avatar_id, created_by_participant_id) VALUES ($1, $2, $3)',
      [anotherParticipantId, testAvatarId, createdByParticipantId]
    );
    
    // Get them back
    const result = await testPool.query(
      'SELECT id, participant_id, avatar_id FROM participant_avatars WHERE avatar_id = $1 ORDER BY created_at DESC',
      [testAvatarId]
    );
    const relationships = result.rows;
    
    expect(Array.isArray(relationships)).toBe(true);
    expect(relationships.length).toBe(2);
    expect(Number(relationships[0].avatar_id)).toBe(Number(testAvatarId));
    expect(Number(relationships[1].avatar_id)).toBe(Number(testAvatarId));
    
    // Clean up the additional participant
    await testPool.query('DELETE FROM participant_avatars WHERE participant_id = $1', [anotherParticipantId]);
    await testPool.query('DELETE FROM participants WHERE id = $1', [anotherParticipantId]);
  });
  
  it('deletes a participant-avatar relationship', async () => {
    // Create a relationship first
    const createResult = await testPool.query(
      'INSERT INTO participant_avatars (participant_id, avatar_id, created_by_participant_id) VALUES ($1, $2, $3) RETURNING id',
      [testParticipantId, testAvatarId, createdByParticipantId]
    );
    const relationshipId = createResult.rows[0].id;
    
    // Delete it
    const deleteResult = await testPool.query(
      'DELETE FROM participant_avatars WHERE id = $1 RETURNING id, participant_id, avatar_id',
      [relationshipId]
    );
    const deletedRelationship = deleteResult.rows[0];
    
    expect(deletedRelationship).toHaveProperty('id');
    expect(Number(deletedRelationship.id)).toBe(Number(relationshipId));
    
    // Verify it's gone
    const verifyResult = await testPool.query(
      'SELECT id FROM participant_avatars WHERE id = $1',
      [relationshipId]
    );
    expect(verifyResult.rows.length).toBe(0);
  });
});

// Test suite for the actual functions
describe('Participant Avatars - Functions', () => {
  let testParticipantId;
  let testAvatarId;
  let createdByParticipantId;
  
  // Make sure schema is set to 'dev' for all tests in this suite
  beforeAll(async () => {
    // Explicitly set the schema for this test suite
    await testPool.query('SET search_path TO dev, public;');
    
    // Create test participant
    const participantResult = await testPool.query(
      'INSERT INTO participants (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      ['Test Function Participant', 'test-function-participant@example.com', 'function-test-password']
    );
    testParticipantId = participantResult.rows[0].id;
    
    // Create another participant to be the creator
    const creatorResult = await testPool.query(
      'INSERT INTO participants (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      ['Function Creator Participant', 'function-creator-participant@example.com', 'function-creator-password']
    );
    createdByParticipantId = creatorResult.rows[0].id;
    
    // Create test avatar
    const avatarResult = await testPool.query(
      'INSERT INTO avatars (name, instruction_set, avatar_scope_id, llm_config) VALUES ($1, $2, $3, $4) RETURNING id',
      ['Test Function Avatar', 'Test Function Instruction Set', 1, '{}']
    );
    testAvatarId = avatarResult.rows[0].id;
  });
  
  afterAll(async () => {
    // Clean up test data
    await testPool.query('DELETE FROM participant_avatars WHERE participant_id = $1', [testParticipantId]);
    await testPool.query('DELETE FROM participant_avatars WHERE created_by_participant_id = $1', [createdByParticipantId]);
    await testPool.query('DELETE FROM participants WHERE id = $1', [testParticipantId]);
    await testPool.query('DELETE FROM participants WHERE id = $1', [createdByParticipantId]);
    await testPool.query('DELETE FROM avatars WHERE id = $1', [testAvatarId]);
  });
  
  beforeEach(async () => {
    // Clean up any existing relationships for this test
    await testPool.query('DELETE FROM participant_avatars WHERE participant_id = $1', [testParticipantId]);
  });
  
  it('createParticipantAvatar creates a relationship', async () => {
    const relationship = await createParticipantAvatar(
      testParticipantId,
      testAvatarId,
      createdByParticipantId
    );
    
    expect(relationship).toHaveProperty('id');
    expect(Number(relationship.participant_id)).toBe(Number(testParticipantId));
    expect(Number(relationship.avatar_id)).toBe(Number(testAvatarId));
    expect(Number(relationship.created_by_participant_id)).toBe(Number(createdByParticipantId));
  });
  
  it('getParticipantAvatarById gets a relationship by ID', async () => {
    // Create a relationship first
    const createdRelationship = await createParticipantAvatar(
      testParticipantId,
      testAvatarId,
      createdByParticipantId
    );
    
    // Get it back using the function
    const relationship = await getParticipantAvatarById(createdRelationship.id);
    
    expect(relationship).toHaveProperty('id');
    expect(Number(relationship.id)).toBe(Number(createdRelationship.id));
    expect(Number(relationship.participant_id)).toBe(Number(testParticipantId));
    expect(Number(relationship.avatar_id)).toBe(Number(testAvatarId));
  });
  
  it('getParticipantAvatarsByParticipant gets relationships by participant', async () => {
    // Create a relationship
    await createParticipantAvatar(
      testParticipantId,
      testAvatarId,
      createdByParticipantId
    );
    
    // Create another avatar for this test
    const anotherAvatarResult = await testPool.query(
      'INSERT INTO avatars (name, instruction_set, avatar_scope_id, llm_config) VALUES ($1, $2, $3, $4) RETURNING id',
      ['Another Function Test Avatar', 'Another Function Instruction Set', 1, '{}']
    );
    const anotherAvatarId = anotherAvatarResult.rows[0].id;
    
    // Create another relationship
    await createParticipantAvatar(
      testParticipantId,
      anotherAvatarId,
      createdByParticipantId
    );
    
    // Get them back using the function
    const relationships = await getParticipantAvatarsByParticipant(testParticipantId);
    
    expect(Array.isArray(relationships)).toBe(true);
    expect(relationships.length).toBe(2);
    expect(Number(relationships[0].participant_id)).toBe(Number(testParticipantId));
    expect(Number(relationships[1].participant_id)).toBe(Number(testParticipantId));
    
    // Clean up the additional avatar
    await testPool.query('DELETE FROM participant_avatars WHERE avatar_id = $1', [anotherAvatarId]);
    await testPool.query('DELETE FROM avatars WHERE id = $1', [anotherAvatarId]);
  });
  
  it('getParticipantAvatarsByAvatar gets relationships by avatar', async () => {
    // Create a relationship
    await createParticipantAvatar(
      testParticipantId,
      testAvatarId,
      createdByParticipantId
    );
    
    // Create another participant for this test
    const anotherParticipantResult = await testPool.query(
      'INSERT INTO participants (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      ['Another Function Test Participant', 'another-function-test-participant@example.com', 'another-function-test-password']
    );
    const anotherParticipantId = anotherParticipantResult.rows[0].id;
    
    // Create another relationship
    await createParticipantAvatar(
      anotherParticipantId,
      testAvatarId,
      createdByParticipantId
    );
    
    // Get them back using the function
    const relationships = await getParticipantAvatarsByAvatar(testAvatarId);
    
    expect(Array.isArray(relationships)).toBe(true);
    expect(relationships.length).toBe(2);
    expect(Number(relationships[0].avatar_id)).toBe(Number(testAvatarId));
    expect(Number(relationships[1].avatar_id)).toBe(Number(testAvatarId));
    
    // Clean up the additional participant
    await testPool.query('DELETE FROM participant_avatars WHERE participant_id = $1', [anotherParticipantId]);
    await testPool.query('DELETE FROM participants WHERE id = $1', [anotherParticipantId]);
  });
  
  it('deleteParticipantAvatar deletes a relationship', async () => {
    // Create a relationship first
    const createdRelationship = await createParticipantAvatar(
      testParticipantId,
      testAvatarId,
      createdByParticipantId
    );
    
    // Delete it using the function
    const deletedRelationship = await deleteParticipantAvatar(createdRelationship.id);
    
    expect(deletedRelationship).toHaveProperty('id');
    expect(Number(deletedRelationship.id)).toBe(Number(createdRelationship.id));
    
    // Verify it's gone
    const verifyResult = await testPool.query(
      'SELECT id FROM participant_avatars WHERE id = $1',
      [createdRelationship.id]
    );
    expect(verifyResult.rows.length).toBe(0);
  });
});
