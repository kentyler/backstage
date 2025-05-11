// @ts-check
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Import test setup to ensure correct schema
import './setup.js';

// Import dotenv to load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Import pg directly
import pg from 'pg';
const { Pool } = pg;

// Create a dedicated test pool with explicit schema
const pool = new Pool({
  connectionString: process.env.DB_HOST,
  ssl: { rejectUnauthorized: false },
});

// Set the search path explicitly for all connections
pool.on('connect', (client) => {
  client.query('SET search_path TO dev, public;');
});

console.log('Created test pool with dev schema');

// Import participant functions directly
import { createParticipant } from '../src/db/participants/createParticipant.js';
import { getParticipantById } from '../src/db/participants/getParticipantById.js';
import { getParticipantByEmail } from '../src/db/participants/getParticipantByEmail.js';
import { getAllParticipants } from '../src/db/participants/getAllParticipants.js';
import { updateParticipant } from '../src/db/participants/updateParticipant.js';
import { deleteParticipant } from '../src/db/participants/deleteParticipant.js';
import { getParticipantsByGroup } from '../src/db/participants/getParticipantsByGroup.js';

/**
 * Test suite for participant database operations using real database
 * Uses pre-existing test group (ID: 1) and test participant (ID: 1)
 * All other test data will be created and cleaned up during tests
 */
describe('Participant Database Integration Tests', () => {
  /**
   * Array to track IDs of participants created during tests for cleanup
   * @type {number[]}
   */
  const createdParticipantIds = [];

  /**
   * Test email prefix to identify test participants
   * @type {string}
   */
  const TEST_EMAIL_PREFIX = 'test_integration_';

  /**
   * Run before all tests to ensure database connection and set schema
   */
  beforeAll(async () => {
    try {
      // Set schema to 'dev' for all tests
      await pool.query('SET search_path TO dev, public;');
      
      // Verify the schema is set correctly
      const schemaResult = await pool.query('SHOW search_path;');
      console.log('Current search path:', schemaResult.rows[0].search_path);
      
      // Check if the schema exists
      const schemaCheck = await pool.query(
        "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'dev'"
      );
      
      console.log('Schema check result:', schemaCheck.rows);
      
      // Check if the participants table exists
      try {
        const tableResult = await pool.query(
          "SELECT table_name FROM information_schema.tables WHERE table_schema = 'dev' AND table_name = 'participants'"
        );
        
        console.log('Table check result:', tableResult.rows);
        
        // If table doesn't exist, create it
        if (tableResult.rows.length === 0) {
          console.log('Creating participants table in dev schema');
          await pool.query(`
            CREATE TABLE IF NOT EXISTS participants (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT NOT NULL UNIQUE,
              password TEXT NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
          `);
        }
      } catch (err) {
        console.error('Error checking or creating participants table:', err.message);
      }
    } catch (error) {
      console.error('Database connection failed:', error.message);
      throw new Error('Failed to connect to database for tests');
    }
  });

  /**
   * Clean up all test participants created during tests
   */
  afterAll(async () => {
    // Delete all test participants except ID 1
    for (const id of createdParticipantIds) {
      try {
        // Use direct pool query for cleanup to avoid potential issues with the function
        await pool.query('DELETE FROM dev.participants WHERE id = $1', [id]);
        console.log(`Cleaned up test participant ID ${id}`);
      } catch (error) {
        console.error(`Failed to clean up test participant ID ${id}: ${error.message}`);
      }
    }

    // Close the pool when done
    await pool.end();
    console.log('Test pool closed');
  });

  /**
   * Tests for the createParticipant function
   */
  describe('createParticipant', () => {
    /**
     * Tests successful creation of a participant
     */
    it('should create a new participant', async () => {
      // Generate unique test email
      const testEmail = `${TEST_EMAIL_PREFIX}${Date.now()}@test.com`;
      
      // Execute the function
      const result = await createParticipant('Test User', testEmail, 'test_password');

      // Store ID for cleanup
      if (result && result.id) {
        // Convert to number if it's a string (PostgreSQL may return numeric values as strings)
        const id = typeof result.id === 'string' ? Number(result.id) : result.id;
        createdParticipantIds.push(id);
      }

      // Assert the result
      expect(result).toBeDefined();
      
      // Convert to number for comparison if needed
      const id = typeof result.id === 'string' ? Number(result.id) : result.id;
      expect(id).toBeGreaterThan(0);
      expect(result.name).toBe('Test User');
      expect(result.email).toBe(testEmail);
    });

    /**
     * Tests error handling when email already exists
     */
    it('should throw an error if email already exists', async () => {
      // First create a participant
      const testEmail = `${TEST_EMAIL_PREFIX}${Date.now()}@test.com`;
      const participant = await createParticipant('Test User', testEmail, 'test_password');
      
      // Store ID for cleanup
      if (participant && participant.id) {
        createdParticipantIds.push(participant.id);
      }

      // Try to create another participant with the same email
      await expect(
        createParticipant('Another User', testEmail, 'another_password')
      ).rejects.toThrow();
    });
  });

  /**
   * Tests for the getParticipantById function
   */
  describe('getParticipantById', () => {
    /**
     * Tests successful retrieval of a participant by ID
     */
    it('should retrieve a participant by ID', async () => {
      // First create a participant
      const testEmail = `${TEST_EMAIL_PREFIX}${Date.now()}@test.com`;
      const created = await createParticipant('Test Retrieval', testEmail, 'test_password');
      
      // Store ID for cleanup
      if (created && created.id) {
        createdParticipantIds.push(created.id);
      }

      // Retrieve the participant
      const result = await getParticipantById(created.id);

      // Assert the result
      expect(result).toBeDefined();
      
      // Convert IDs to numbers for comparison
      const resultId = typeof result.id === 'string' ? Number(result.id) : result.id;
      const createdId = typeof created.id === 'string' ? Number(created.id) : created.id;
      
      expect(resultId).toBe(createdId);
      expect(result.name).toBe('Test Retrieval');
      expect(result.email).toBe(testEmail);
    });

    /**
     * Tests behavior when participant is not found
     */
    it('should return null if participant is not found', async () => {
      // Use a non-existent ID (very large number)
      const result = await getParticipantById(9999999);

      // Assert the result
      expect(result).toBeNull();
    });
    
    /**
     * Tests that the predefined test participant exists
     */
    it('should retrieve the predefined test participant (ID: 1)', async () => {
      const result = await getParticipantById(1);
      
      // Assert the result exists (details may vary)
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });
  });

  /**
   * Tests for the getParticipantByEmail function
   */
  describe('getParticipantByEmail', () => {
    /**
     * Tests successful retrieval of a participant by email
     */
    it('should retrieve a participant by email', async () => {
      // First create a participant
      const testEmail = `${TEST_EMAIL_PREFIX}${Date.now()}@test.com`;
      const created = await createParticipant('Email Test', testEmail, 'test_password');
      
      // Store ID for cleanup
      if (created && created.id) {
        createdParticipantIds.push(created.id);
      }

      // Retrieve the participant
      const result = await getParticipantByEmail(testEmail);

      // Assert the result
      expect(result).toBeDefined();
      
      // Convert IDs to numbers for comparison
      const resultId = typeof result.id === 'string' ? Number(result.id) : result.id;
      const createdId = typeof created.id === 'string' ? Number(created.id) : created.id;
      
      expect(resultId).toBe(createdId);
      expect(result.name).toBe('Email Test');
      expect(result.email).toBe(testEmail);
    });

    /**
     * Tests behavior when email is not found
     */
    it('should return null if email is not found', async () => {
      // Use a non-existent email
      const result = await getParticipantByEmail('nonexistent_email@example.com');

      // Assert the result
      expect(result).toBeNull();
    });
  });

  /**
   * Tests for the getAllParticipants function
   */
  describe('getAllParticipants', () => {
    /**
     * Tests successful retrieval of all participants
     */
    it('should retrieve all participants including test participants', async () => {
      // Create a few test participants
      const testEmail1 = `${TEST_EMAIL_PREFIX}${Date.now()}_1@test.com`;
      const testEmail2 = `${TEST_EMAIL_PREFIX}${Date.now()}_2@test.com`;
      
      const participant1 = await createParticipant('Test All 1', testEmail1, 'test_password');
      const participant2 = await createParticipant('Test All 2', testEmail2, 'test_password');
      
      // Store IDs for cleanup
      if (participant1 && participant1.id) createdParticipantIds.push(participant1.id);
      if (participant2 && participant2.id) createdParticipantIds.push(participant2.id);

      // Retrieve all participants
      const result = await getAllParticipants();

      // Assert the result
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Check if our test participants are in the result
      const foundTestParticipant1 = result.some(p => p.email === testEmail1);
      const foundTestParticipant2 = result.some(p => p.email === testEmail2);
      
      expect(foundTestParticipant1).toBe(true);
      expect(foundTestParticipant2).toBe(true);
    });
  });

  /**
   * Tests for the updateParticipant function
   */
  describe('updateParticipant', () => {
    /**
     * Tests successful update of a participant
     */
    it('should update a participant\'s information', async () => {
      // First create a participant
      const testEmail = `${TEST_EMAIL_PREFIX}${Date.now()}@test.com`;
      const created = await createParticipant('Before Update', testEmail, 'test_password');
      
      // Store ID for cleanup
      if (created && created.id) {
        createdParticipantIds.push(created.id);
      }

      // Update the participant
      const updatedEmail = `${TEST_EMAIL_PREFIX}updated_${Date.now()}@test.com`;
      const result = await updateParticipant(created.id, {
        name: 'After Update',
        email: updatedEmail
      });

      // Assert the result
      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.name).toBe('After Update');
      expect(result.email).toBe(updatedEmail);

      // Verify by retrieving the participant
      const retrieved = await getParticipantById(created.id);
      expect(retrieved.name).toBe('After Update');
      expect(retrieved.email).toBe(updatedEmail);
    });

    /**
     * Tests behavior when participant is not found
     */
    it('should return null if participant to update is not found', async () => {
      // Use a non-existent ID
      const result = await updateParticipant(9999999, { name: 'New Name' });

      // Assert the result
      expect(result).toBeNull();
    });

    /**
     * Tests error handling when email already exists
     */
    it('should throw an error if updated email already exists', async () => {
      // Create two participants
      const testEmail1 = `${TEST_EMAIL_PREFIX}${Date.now()}_1@test.com`;
      const testEmail2 = `${TEST_EMAIL_PREFIX}${Date.now()}_2@test.com`;
      
      const participant1 = await createParticipant('Email Test 1', testEmail1, 'test_password');
      const participant2 = await createParticipant('Email Test 2', testEmail2, 'test_password');
      
      // Store IDs for cleanup
      if (participant1 && participant1.id) createdParticipantIds.push(participant1.id);
      if (participant2 && participant2.id) createdParticipantIds.push(participant2.id);

      // Try to update the second participant with the first participant's email
      await expect(
        updateParticipant(participant2.id, { email: testEmail1 })
      ).rejects.toThrow();
    });
  });

  /**
   * Tests for the deleteParticipant function
   */
  describe('deleteParticipant', () => {
    /**
     * Tests successful deletion of a participant
     */
    it('should delete a participant', async () => {
      // First create a participant
      const testEmail = `${TEST_EMAIL_PREFIX}${Date.now()}@test.com`;
      const created = await createParticipant('To Delete', testEmail, 'test_password');
      
      // Execute the delete function
      const result = await deleteParticipant(created.id);

      // Assert the result
      expect(result).toBe(true);

      // Verify the participant is deleted
      const retrieved = await getParticipantById(created.id);
      expect(retrieved).toBeNull();
    });

    /**
     * Tests behavior when participant is not found
     */
    it('should return false if participant to delete is not found', async () => {
      // Use a non-existent ID
      const result = await deleteParticipant(9999999);

      // Assert the result
      expect(result).toBe(false);
    });
  });

  /**
   * Tests for the getParticipantsByGroup function
   */
  describe('getParticipantsByGroup', () => {
    /**
     * Tests retrieval of participants in a group
     * Using the predefined test group (ID: 1)
     */
    it('should retrieve participants in the test group', async () => {
      // Get participants in test group
      const result = await getParticipantsByGroup(1);
      
      // Assert the result structure
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
    
    /**
     * Tests behavior for a non-existent group
     */
    it('should return an empty array for a non-existent group', async () => {
      // Use a non-existent group ID
      const result = await getParticipantsByGroup(9999999);
      
      // Assert the result
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});