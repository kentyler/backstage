/**
 * @file test/comments.test.js
 * @description Tests for the comments feature
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool } from '../src/db/connection.js';
import { createGrpConAvatarTurn, TURN_KIND } from '../src/db/grpConAvatarTurns/createGrpConAvatarTurn.js';
import { getGrpConAvatarTurnsByConversation } from '../src/db/grpConAvatarTurns/getGrpConAvatarTurnsByConversation.js';
import { createGrpCon } from '../src/db/grpCons/createGrpCon.js';
import { deleteGrpCon } from '../src/db/grpCons/deleteGrpCon.js';

describe('Comments Feature', () => {
  // Test data
  let testConversationId;
  let regularTurn1;
  let regularTurn2;
  let commentTurn;
  let nestedCommentTurn;

  // Setup: Create a test conversation and turns
  beforeAll(async () => {
    // Create a test conversation
    const testConversation = await createGrpCon(1, 'Test Conversation', 'For testing comments', 1, pool);
    testConversationId = testConversation.id;

    // Create two regular turns
    regularTurn1 = await createGrpConAvatarTurn(
      testConversationId,
      1, // avatarId
      22, // turnIndex
      'This is a regular turn',
      [], // empty vector for testing
      TURN_KIND.REGULAR,
      pool
    );

    regularTurn2 = await createGrpConAvatarTurn(
      testConversationId,
      1, // avatarId
      21, // turnIndex
      'This is another regular turn',
      [], // empty vector for testing
      TURN_KIND.REGULAR,
      pool
    );
  });

  // Cleanup: Delete the test conversation
  afterAll(async () => {
    if (testConversationId) {
      await deleteGrpCon(testConversationId,);
    }
    await pool.end();
  });

  it('should create a comment with a decimal index', async () => {
    // Create a comment on regularTurn1
    commentTurn = await createGrpConAvatarTurn(
      testConversationId,
      1, // avatarId
      21.5, // turnIndex (between 22 and 21)
      'This is a comment on the first turn',
      [], // empty vector for testing
      TURN_KIND.COMMENT,
      pool
    );

    // Verify the comment was created with the correct properties
    expect(commentTurn).toBeDefined();
    expect(commentTurn.turn_index).toBe('21.50');
    expect(commentTurn.turn_kind_id).toBe(TURN_KIND.COMMENT);
    expect(commentTurn.content_text).toBe('This is a comment on the first turn');
  });

  it('should create a nested comment with a decimal index', async () => {
    // Create a nested comment (a comment on the comment)
    nestedCommentTurn = await createGrpConAvatarTurn(
      testConversationId,
      1, // avatarId
      21.75, // turnIndex (between 22 and 21.5)
      'This is a nested comment',
      [], // empty vector for testing
      TURN_KIND.COMMENT,
      pool
    );

    // Verify the nested comment was created with the correct properties
    expect(nestedCommentTurn).toBeDefined();
    expect(nestedCommentTurn.turn_index).toBe('21.75');
    expect(nestedCommentTurn.turn_kind_id).toBe(TURN_KIND.COMMENT);
    expect(nestedCommentTurn.content_text).toBe('This is a nested comment');
  });

  it('should retrieve turns in the correct order', async () => {
    // Get all turns in the conversation
    const turns = await getGrpConAvatarTurnsByConversation(testConversationId, pool);
    
    // Verify we have all the turns
    expect(turns.length).toBe(4);
    
    // Verify the turns are in the correct order (by turn_index)
    const sortedTurns = [...turns].sort((a, b) => Number(b.turn_index) - Number(a.turn_index));
    
    expect(sortedTurns[0].id).toBe(regularTurn1.id); // 22
    expect(sortedTurns[1].id).toBe(nestedCommentTurn.id); // 21.75
    expect(sortedTurns[2].id).toBe(commentTurn.id); // 21.5
    expect(sortedTurns[3].id).toBe(regularTurn2.id); // 21
  });
});