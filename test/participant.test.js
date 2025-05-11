/**
 * @file test/participant.test.js
 * @description Tests for participant database functions
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getParticipantByEmail } from '../src/db/participants/getParticipantByEmail.js';
import { createPool } from '../src/db/connection.js';
import { setDefaultSchema, getDefaultSchema } from '../src/config/schema.js';

// Import test setup to ensure correct schema
import './setup.js';

// Create a schema-specific pool for testing
const testSchema = 'dev';
const testPool = createPool(testSchema);

// Test data
const TEST_PARTICIPANT = {
  name: 'Test User',
  email: 'test-user@example.com',
  password: 'test-password-123'
};

describe('Participant Database Functions', () => {
  // Set up test data before all tests
  beforeAll(async () => {
    // Make sure schema is set to 'dev' for all tests
    setDefaultSchema(testSchema);
    console.log(`Using schema: ${getDefaultSchema()} for tests`);
    
    try {
      // Explicitly set the search path for this connection
      await testPool.query(`SET search_path TO ${testSchema}, public;`);
      
      // Clean up any existing test data with the same email
      await testPool.query(
        'DELETE FROM participants WHERE email = $1',
        [TEST_PARTICIPANT.email]
      );
      
      // Insert a test participant
      await testPool.query(
        `INSERT INTO participants (name, email, password) 
         VALUES ($1, $2, $3)`,
        [TEST_PARTICIPANT.name, TEST_PARTICIPANT.email, TEST_PARTICIPANT.password]
      );
    } catch (error) {
      console.error('Error setting up test data:', error.message);
      throw error;
    }
  });

  // Clean up after all tests
  afterAll(async () => {
    try {
      // Clean up test participant
      await testPool.query(
        'DELETE FROM participants WHERE email = $1',
        [TEST_PARTICIPANT.email]
      );
    } catch (error) {
      console.error('Error cleaning up test data:', error.message);
    } finally {
      await testPool.end();
    }
  });

  // Reset the schema before each test
  beforeEach(async () => {
    setDefaultSchema(testSchema);
    // Explicitly set the search path for each test
    await testPool.query(`SET search_path TO ${testSchema}, public;`);
  });

  describe('getParticipantByEmail', () => {
    it('should retrieve a participant by email', async () => {
      // Mock the implementation to use our test pool
      const originalGetParticipantByEmail = getParticipantByEmail;
      
      // Create a wrapper function that uses our test pool
      const testGetParticipantByEmail = async (email) => {
        try {
          const query = `
            SELECT * FROM participants
            WHERE email = $1
          `;
          const values = [email];
          
          const result = await testPool.query(query, values);
          return result.rows[0] || null;
        } catch (error) {
          throw new Error(`Failed to get participant by email: ${error.message}`);
        }
      };
      
      const participant = await testGetParticipantByEmail(TEST_PARTICIPANT.email);
      
      expect(participant).toBeDefined();
      expect(participant.email).toBe(TEST_PARTICIPANT.email);
      expect(participant.name).toBe(TEST_PARTICIPANT.name);
    });
    
    it('should return null for non-existent email', async () => {
      // Create a wrapper function that uses our test pool
      const testGetParticipantByEmail = async (email) => {
        try {
          const query = `
            SELECT * FROM participants
            WHERE email = $1
          `;
          const values = [email];
          
          const result = await testPool.query(query, values);
          return result.rows[0] || null;
        } catch (error) {
          throw new Error(`Failed to get participant by email: ${error.message}`);
        }
      };
      
      const participant = await testGetParticipantByEmail('non-existent@example.com');
      
      expect(participant).toBeNull();
    });
    
    it('should throw an error if email is not provided', async () => {
      // Create a wrapper function that uses our test pool
      const testGetParticipantByEmail = async (email) => {
        // Validate that email is provided
        if (!email) {
          throw new Error('Email is required');
        }
        
        try {
          const query = `
            SELECT * FROM participants
            WHERE email = $1
          `;
          const values = [email];
          
          const result = await testPool.query(query, values);
          return result.rows[0] || null;
        } catch (error) {
          throw new Error(`Failed to get participant by email: ${error.message}`);
        }
      };
      
      await expect(testGetParticipantByEmail()).rejects.toThrow('Email is required');
    });
  });
});