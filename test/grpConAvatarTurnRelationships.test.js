/**
 * @file tests/grpConAvatarTurnRelationships.test.js
 * @description Integration tests for avatar turn relationship operations.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { pool } from '../src/db/connection.js';
import { createGrpCon, deleteGrpCon } from '../src/db/grpCons/index.js';
import { createGrpConAvatarTurn, deleteGrpConAvatarTurn } from '../src/db/grpConAvatarTurns/index.js';
import {
  createGrpConAvatarTurnRelationship,
  getGrpConAvatarTurnRelationshipById,
  getGrpConAvatarTurnRelationshipsByTurn,
  updateGrpConAvatarTurnRelationship,
  deleteGrpConAvatarTurnRelationship
} from '../src/db/grpConAvatarTurnRelationships/index.js';

/**
 * Temporary storage for created IDs during tests.
 * @type {{ convId: number, turnA: object, turnB: object }}
 */
let convId, turnA, turnB;

/**
 * Helper: cleans up test data (relationships, turns, conversation).
 * @returns {Promise<void>}
 */
async function cleanup() {
  await pool.query(
    'DELETE FROM grp_con_avatar_turn_relationships WHERE turn_id = $1 OR turn_id = $2',
    [turnA.id, turnB.id]
  );
  await deleteGrpConAvatarTurn(turnA.id);
  await deleteGrpConAvatarTurn(turnB.id);
  await deleteGrpCon(convId);
}

describe('Group Conversation Avatar Turn Relationships', () => {
  beforeEach(async () => {
    // Create a conversation and two turns (prompt & response)
    const conv = await createGrpCon(1, 'rel-test', 'initial');
    convId = conv.id;
    turnA = await createGrpConAvatarTurn(convId, 1, 0, 'prompt', Array(1536).fill(0));
    turnB = await createGrpConAvatarTurn(convId, 2, 1, 'response', Array(1536).fill(1));
  });

  afterEach(async () => {
    await cleanup();
  });

  it('creates a relationship', async () => {
    const rel = await createGrpConAvatarTurnRelationship(turnB.id, turnA.id);
    expect(rel).toHaveProperty('id');
    expect(rel.turn_id).toBe(turnB.id);
    expect(rel.target_turn_id).toBe(turnA.id);
    expect(rel.turn_relationship_type_id).toBe(1);
  });

  it('gets relationship by ID', async () => {
    const { id } = await createGrpConAvatarTurnRelationship(turnB.id, turnA.id);
    const fetched = await getGrpConAvatarTurnRelationshipById(id);
    expect(fetched.id).toBe(id);
  });

  it('lists relationships by turn', async () => {
    await createGrpConAvatarTurnRelationship(turnB.id, turnA.id, 1);
    await createGrpConAvatarTurnRelationship(turnB.id, turnA.id, 2);
    const list = await getGrpConAvatarTurnRelationshipsByTurn(turnB.id);
    expect(list.length).toBe(2);
  });

  it('updates a relationship', async () => {
    const { id } = await createGrpConAvatarTurnRelationship(turnB.id, turnA.id, 1);
    const updated = await updateGrpConAvatarTurnRelationship(id, 2);
    expect(updated.turn_relationship_type_id).toBe(2);
  });

  it('deletes a relationship', async () => {
    const { id } = await createGrpConAvatarTurnRelationship(turnB.id, turnA.id);
    const ok = await deleteGrpConAvatarTurnRelationship(id);
    expect(ok).toBe(true);
    const gone = await getGrpConAvatarTurnRelationshipById(id);
    expect(gone).toBeNull();
  });
});
