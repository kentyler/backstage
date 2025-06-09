/**
 * Invitation System Test Suite
 * Tests invitation creation, lookup, and acceptance
 */

import { expect } from 'chai';
import pg from 'pg';
import { createInvitation, getInvitationByToken, acceptInvitation } from '../../db/auth/invitations/index.js';

const { Client } = pg;

// Test database connection
const testClient = new Client({
  connectionString: 'postgresql://neondb_owner:npg_t2aufdmn3sbw@ep-sparkling-violet-a4j85pt4-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

describe('Invitation System', function() {
  this.timeout(10000);
  
  let testInviterId;
  let testToken;

  before(async function() {
    console.log('🔐 INVITATION TESTS: Connecting to database...');
    await testClient.connect();
    
    // Create a test inviter participant
    const inviterResult = await testClient.query(`
      INSERT INTO participants (name, email, password, client_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['Test Inviter', `inviter-${Date.now()}@example.com`, 'hashedpass', 1]);
    
    testInviterId = inviterResult.rows[0].id;
    console.log('🔐 INVITATION TESTS: Created test inviter:', testInviterId);
  });

  after(async function() {
    // Clean up test data
    await testClient.query(`
      DELETE FROM participant_invitations WHERE invited_by = $1
    `, [testInviterId]);
    
    await testClient.query(`
      DELETE FROM participants WHERE id = $1
    `, [testInviterId]);
    
    // Clean up any test participants created during acceptance tests
    await testClient.query(`
      DELETE FROM participants WHERE email LIKE 'test-invite-%@example.com'
    `);
    
    console.log('🔐 INVITATION TESTS: Cleaned up test data');
    await testClient.end();
  });

  describe('Invitation Creation', function() {
    
    it('should create a valid invitation', async function() {
      const email = `test-invite-${Date.now()}@example.com`;
      
      const invitation = await createInvitation(testClient, testInviterId, email, 1);
      testToken = invitation.invitation_token; // Save for later tests
      
      expect(invitation).to.have.property('id');
      expect(invitation.email).to.equal(email);
      expect(invitation.invitation_token).to.be.a('string');
      expect(invitation.invitation_token).to.have.lengthOf(64); // 32 bytes hex
      expect(invitation.expires_at).to.be.a('date');
      expect(invitation.expires_at).to.be.greaterThan(new Date());
    });

    it('should prevent duplicate invitations for same email', async function() {
      const email = `duplicate-invite-${Date.now()}@example.com`;
      
      // First invitation should succeed
      await createInvitation(testClient, testInviterId, email, 1);
      
      // Second invitation should fail
      try {
        await createInvitation(testClient, testInviterId, email, 1);
        expect.fail('Should not allow duplicate invitations');
      } catch (error) {
        expect(error.message).to.include('invitation for this email address already exists');
      }
    });

    it('should prevent inviting existing participants', async function() {
      const email = `existing-${Date.now()}@example.com`;
      
      // Create a participant first
      await testClient.query(`
        INSERT INTO participants (name, email, password, client_id)
        VALUES ($1, $2, $3, $4)
      `, ['Existing User', email, 'hashedpass', 1]);
      
      // Try to invite them
      try {
        await createInvitation(testClient, testInviterId, email, 1);
        expect.fail('Should not allow inviting existing participants');
      } catch (error) {
        expect(error.message).to.include('participant with this email address already exists');
      }
      
      // Cleanup
      await testClient.query(`DELETE FROM participants WHERE email = $1`, [email]);
    });

    it('should generate unique tokens', async function() {
      const tokens = [];
      
      for (let i = 0; i < 5; i++) {
        const email = `token-test-${i}-${Date.now()}@example.com`;
        const invitation = await createInvitation(testClient, testInviterId, email, 1);
        tokens.push(invitation.invitation_token);
      }
      
      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).to.equal(tokens.length);
    });
  });

  describe('Invitation Lookup', function() {
    
    it('should retrieve invitation by valid token', async function() {
      const invitation = await getInvitationByToken(testClient, testToken);
      
      expect(invitation).to.not.be.null;
      expect(invitation.invitation_token).to.equal(testToken);
      expect(invitation).to.have.property('invited_by_name');
      expect(invitation).to.have.property('invited_by_email');
      expect(invitation.accepted_at).to.be.null;
    });

    it('should return null for invalid token', async function() {
      const invitation = await getInvitationByToken(testClient, 'invalid-token');
      expect(invitation).to.be.null;
    });

    it('should return null for expired invitation', async function() {
      const email = `expired-invite-${Date.now()}@example.com`;
      
      // Create invitation with past expiration
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      
      const result = await testClient.query(`
        INSERT INTO participant_invitations 
        (invited_by, email, client_id, invitation_token, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING invitation_token
      `, [testInviterId, email, 1, 'expired-token-test', pastDate]);
      
      const expiredToken = result.rows[0].invitation_token;
      
      const invitation = await getInvitationByToken(testClient, expiredToken);
      expect(invitation).to.be.null;
    });
  });

  describe('Invitation Acceptance', function() {
    
    it('should accept valid invitation and create participant', async function() {
      const email = `accept-test-${Date.now()}@example.com`;
      
      // Create invitation
      const newInvitation = await createInvitation(testClient, testInviterId, email, 1);
      
      // Accept invitation
      const participant = await acceptInvitation(
        testClient, 
        newInvitation.invitation_token, 
        'New Participant', 
        'SecurePassword123!'
      );
      
      expect(participant).to.have.property('id');
      expect(participant.name).to.equal('New Participant');
      expect(participant.email).to.equal(email);
      expect(participant.client_id).to.equal(1);
      
      // Verify invitation is marked as accepted
      const updatedInvitation = await testClient.query(`
        SELECT accepted_at FROM participant_invitations 
        WHERE invitation_token = $1
      `, [newInvitation.invitation_token]);
      
      expect(updatedInvitation.rows[0].accepted_at).to.not.be.null;
      
      // Verify participant can be found
      const createdParticipant = await testClient.query(`
        SELECT id, name, email, client_id FROM participants 
        WHERE email = $1 AND client_id = $2
      `, [email, 1]);
      
      expect(createdParticipant.rows.length).to.equal(1);
      expect(createdParticipant.rows[0].name).to.equal('New Participant');
    });

    it('should prevent accepting already accepted invitation', async function() {
      const email = `already-accepted-${Date.now()}@example.com`;
      
      // Create and accept invitation
      const invitation = await createInvitation(testClient, testInviterId, email, 1);
      await acceptInvitation(testClient, invitation.invitation_token, 'First Accept', 'Password123!');
      
      // Try to accept again
      try {
        await acceptInvitation(testClient, invitation.invitation_token, 'Second Accept', 'Password456!');
        expect.fail('Should not allow accepting already accepted invitation');
      } catch (error) {
        expect(error.message).to.include('already been accepted');
      }
    });

    it('should prevent accepting expired invitation', async function() {
      const email = `expired-accept-${Date.now()}@example.com`;
      
      // Create expired invitation
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await testClient.query(`
        INSERT INTO participant_invitations 
        (invited_by, email, client_id, invitation_token, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING invitation_token
      `, [testInviterId, email, 1, 'expired-accept-token', pastDate]);
      
      // Try to accept expired invitation
      try {
        await acceptInvitation(testClient, result.rows[0].invitation_token, 'Late Accept', 'Password123!');
        expect.fail('Should not allow accepting expired invitation');
      } catch (error) {
        expect(error.message).to.include('expired');
      }
    });
  });

  describe('Database Integrity', function() {
    
    it('should maintain referential integrity', async function() {
      // Invitations should be deleted if inviter is deleted (CASCADE)
      const tempInviter = await testClient.query(`
        INSERT INTO participants (name, email, password, client_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, ['Temp Inviter', `temp-inviter-${Date.now()}@example.com`, 'hashedpass', 1]);
      
      const tempInviterId = tempInviter.rows[0].id;
      
      // Create invitation from temp inviter
      const email = `cascade-test-${Date.now()}@example.com`;
      await createInvitation(testClient, tempInviterId, email, 1);
      
      // Verify invitation exists
      const beforeDelete = await testClient.query(`
        SELECT COUNT(*) FROM participant_invitations WHERE invited_by = $1
      `, [tempInviterId]);
      expect(parseInt(beforeDelete.rows[0].count)).to.equal(1);
      
      // Delete inviter
      await testClient.query(`DELETE FROM participants WHERE id = $1`, [tempInviterId]);
      
      // Verify invitations are cascaded
      const afterDelete = await testClient.query(`
        SELECT COUNT(*) FROM participant_invitations WHERE invited_by = $1
      `, [tempInviterId]);
      expect(parseInt(afterDelete.rows[0].count)).to.equal(0);
    });
  });
});

console.log('🔐 INVITATION TESTS: Test suite loaded successfully');