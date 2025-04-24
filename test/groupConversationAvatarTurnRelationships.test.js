/**
 * @file tests/groupConversationAvatarTurnRelationships.test.js
 * @description Integration tests for avatar turn relationship operations.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { pool } from '../src/db/connection.js';
import { createGroupConversation, deleteGroupConversation } from '../src/db/groupConversations';
import { createGroupConversationAvatarTurn, deleteGroupConversationAvatarTurn } from '../src/db/groupConversationAvatarTurns';
import {
  createGroupConversationAvatarTurnRelationship,
  getGroupConversationAvatarTurnRelationshipById,
  getGroupConversationAvatarTurnRelationshipsByTurn,
  updateGroupConversationAvatarTurnRelationship,
  deleteGroupConversationAvatarTurnRelationship
} from '../src/db/groupConversationAvatarTurnRelationships';

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
    'DELETE FROM public.group_conversation_avatar_turn_relationships WHERE turn_id = $1 OR turn_id = $2',
    [turnA.id, turnB.id]
  );
  await deleteGroupConversationAvatarTurn(turnA.id);
  await deleteGroupConversationAvatarTurn(turnB.id);
  await deleteGroupConversation(convId);
}

describe('Group Conversation Avatar Turn Relationships', () => {
  beforeEach(async () => {
    // Create a conversation and two turns (prompt & response)
    const conv = await createGroupConversation(1, 'rel-test', 'initial');
    convId = conv.id;
    turnA = await createGroupConversationAvatarTurn(convId, 1, 0, 'prompt', Array(1536).fill(0));
    turnB = await createGroupConversationAvatarTurn(convId, 2, 1, 'response', Array(1536).fill(1));
  });

  afterEach(async () => {
    await cleanup();
  });

  it('creates a relationship', async () => {
    const rel = await createGroupConversationAvatarTurnRelationship(turnB.id, turnA.id);
    expect(rel).toHaveProperty('id');
    expect(rel.turn_id).toBe(turnB.id);
    expect(rel.target_turn_id).toBe(turnA.id);
    expect(rel.turn_relationship_type_id).toBe(1);
  });

  it('gets relationship by ID', async () => {
    const { id } = await createGroupConversationAvatarTurnRelationship(turnB.id, turnA.id);
    const fetched = await getGroupConversationAvatarTurnRelationshipById(id);
    expect(fetched.id).toBe(id);
  });

  it('lists relationships by turn', async () => {
    await createGroupConversationAvatarTurnRelationship(turnB.id, turnA.id, 1);
    await createGroupConversationAvatarTurnRelationship(turnB.id, turnA.id, 2);
    const list = await getGroupConversationAvatarTurnRelationshipsByTurn(turnB.id);
    expect(list.length).toBe(2);
  });

  it('updates a relationship', async () => {
    const { id } = await createGroupConversationAvatarTurnRelationship(turnB.id, turnA.id, 1);
    const updated = await updateGroupConversationAvatarTurnRelationship(id, 2);
    expect(updated.turn_relationship_type_id).toBe(2);
  });

  it('deletes a relationship', async () => {
    const { id } = await createGroupConversationAvatarTurnRelationship(turnB.id, turnA.id);
    const ok = await deleteGroupConversationAvatarTurnRelationship(id);
    expect(ok).toBe(true);
    const gone = await getGroupConversationAvatarTurnRelationshipById(id);
    expect(gone).toBeNull();
  });
});
