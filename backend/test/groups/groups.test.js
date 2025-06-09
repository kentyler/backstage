/**
 * Groups System Test Suite
 * Tests groups CRUD operations and membership management
 */

import { expect } from 'chai';
import pg from 'pg';
import { 
  createGroup, 
  getAllGroups, 
  getGroupById, 
  updateGroup, 
  deleteGroup,
  addParticipantToGroup,
  removeParticipantFromGroup,
  getParticipantsByGroup
} from '../../db/groups/index.js';

const { Client } = pg;

// Test database connection
const testClient = new Client({
  connectionString: 'postgresql://neondb_owner:npg_t2aufdmn3sbw@ep-sparkling-violet-a4j85pt4-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

describe('Groups System', function() {
  this.timeout(10000);
  
  let testClientId = 1;
  let testParticipantId;
  let testGroupId;

  before(async function() {
    console.log('🏢 GROUPS TESTS: Connecting to database...');
    await testClient.connect();
    
    // Create a test participant
    const participantResult = await testClient.query(`
      INSERT INTO participants (name, email, password, client_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['Test Participant', `group-test-${Date.now()}@example.com`, 'hashedpass', testClientId]);
    
    testParticipantId = participantResult.rows[0].id;
    console.log('🏢 GROUPS TESTS: Created test participant:', testParticipantId);
  });

  after(async function() {
    // Clean up test data
    if (testGroupId) {
      try {
        await testClient.query('DELETE FROM groups WHERE id = $1', [testGroupId]);
      } catch (error) {
        // Group might already be deleted in tests
      }
    }
    
    await testClient.query('DELETE FROM participants WHERE id = $1', [testParticipantId]);
    
    console.log('🏢 GROUPS TESTS: Cleaned up test data');
    await testClient.end();
  });

  describe('Group CRUD Operations', function() {
    
    it('should create a group for a specific client', async function() {
      const groupName = `Test Group ${Date.now()}`;
      
      const group = await createGroup(testClient, groupName, testClientId);
      testGroupId = group.id; // Store for cleanup
      
      expect(group).to.have.property('id');
      expect(group.name).to.equal(groupName);
      expect(group.client_id).to.equal(testClientId);
      expect(group).to.have.property('created_at');
    });

    it('should prevent duplicate group names within same client', async function() {
      const groupName = `Duplicate Test ${Date.now()}`;
      
      // Create first group
      await createGroup(testClient, groupName, testClientId);
      
      // Try to create duplicate
      try {
        await createGroup(testClient, groupName, testClientId);
        expect.fail('Should not allow duplicate group names');
      } catch (error) {
        expect(error.message).to.include('already exists for this client');
      }
    });

    it('should get all groups for a specific client', async function() {
      const groups = await getAllGroups(testClient, testClientId);
      
      expect(groups).to.be.an('array');
      expect(groups.length).to.be.greaterThan(0);
      
      // All groups should belong to the test client
      groups.forEach(group => {
        expect(group.client_id).to.equal(testClientId);
        expect(group).to.have.property('id');
        expect(group).to.have.property('name');
        expect(group).to.have.property('created_at');
      });
    });

    it('should get a specific group by ID and client', async function() {
      const group = await getGroupById(testClient, testGroupId, testClientId);
      
      expect(group).to.not.be.null;
      expect(group.id).to.equal(testGroupId);
      expect(group.client_id).to.equal(testClientId);
    });

    it('should return null for group from different client', async function() {
      const differentClientId = 999;
      const group = await getGroupById(testClient, testGroupId, differentClientId);
      
      expect(group).to.be.null;
    });

    it('should update a group name', async function() {
      const newName = `Updated Group ${Date.now()}`;
      
      const updatedGroup = await updateGroup(testClient, testGroupId, testClientId, { name: newName });
      
      expect(updatedGroup).to.not.be.null;
      expect(updatedGroup.name).to.equal(newName);
      expect(updatedGroup.id).to.equal(testGroupId);
    });
  });

  describe('Group Membership', function() {
    
    it('should add a participant to a group', async function() {
      const membership = await addParticipantToGroup(
        testClient, 
        testParticipantId, 
        testGroupId, 
        testClientId,
        1 // role ID
      );
      
      expect(membership).to.have.property('participant_id', testParticipantId);
      expect(membership).to.have.property('group_id', testGroupId.toString());
      expect(membership).to.have.property('participant_role_id', 1);
      expect(membership).to.have.property('created_at');
    });

    it('should prevent duplicate memberships', async function() {
      try {
        await addParticipantToGroup(testClient, testParticipantId, testGroupId, testClientId);
        expect.fail('Should not allow duplicate memberships');
      } catch (error) {
        expect(error.message).to.include('already a member');
      }
    });

    it('should get participants in a group', async function() {
      const participants = await getParticipantsByGroup(testClient, testGroupId, testClientId);
      
      expect(participants).to.be.an('array');
      expect(participants.length).to.equal(1);
      expect(participants[0].id).to.equal(testParticipantId);
      expect(participants[0]).to.have.property('name');
      expect(participants[0]).to.have.property('email');
      expect(participants[0]).to.have.property('participant_role_id');
    });

    it('should remove a participant from a group', async function() {
      const result = await removeParticipantFromGroup(testClient, testParticipantId, testGroupId, testClientId);
      
      expect(result).to.be.true;
      
      // Verify participant is no longer in group
      const participants = await getParticipantsByGroup(testClient, testGroupId, testClientId);
      expect(participants).to.be.an('array');
      expect(participants.length).to.equal(0);
    });
  });

  describe('Group Deletion', function() {
    
    it('should delete a group', async function() {
      const result = await deleteGroup(testClient, testGroupId, testClientId);
      
      expect(result).to.be.true;
      
      // Verify group is deleted
      const group = await getGroupById(testClient, testGroupId, testClientId);
      expect(group).to.be.null;
      
      testGroupId = null; // Prevent cleanup attempt
    });
  });

  describe('Client Isolation', function() {
    
    it('should only show groups for the correct client', async function() {
      // Create groups for different clients
      const client1Groups = await getAllGroups(testClient, 1);
      const client2Groups = await getAllGroups(testClient, 2);
      
      // Each should only contain groups for their respective client
      client1Groups.forEach(group => {
        expect(group.client_id).to.equal(1);
      });
      
      client2Groups.forEach(group => {
        expect(group.client_id).to.equal(2);
      });
    });
  });
});

console.log('🏢 GROUPS TESTS: Test suite loaded successfully');