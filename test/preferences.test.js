// tests/preferences.test.js

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
  createParticipantPreference,
  createGroupPreference,
  createSitePreference,
  getPreferenceWithFallback,
  getPreferenceTypeByName,
  getAllPreferenceTypes
} from '../src/db/preferences/index.js';

// Create a dedicated test pool with explicit schema
const testPool = new Pool({
  connectionString: process.env.DB_HOST,
  ssl: { rejectUnauthorized: false },
});

// Set the search path explicitly for all connections
testPool.on('connect', (client) => {
  client.query('SET search_path TO dev, public;');
});

// Test data
const TEST_PREFERENCE_TYPE = {
  name: 'test-preference-type',
  description: 'Test preference type for automated tests'
};

// Define the test preference value as a BIGINT
const TEST_PREFERENCE_VALUE = 42;

// Variables to store test data IDs
let testParticipantId;
let testGroupId;
let testPreferenceTypeId;

describe('Preferences Module', () => {
  // Set up test data before all tests
  beforeAll(async () => {
    // Make sure schema is set to 'dev' for all tests in this suite
    await testPool.query('SET search_path TO dev, public;');
    
    // Create test participant
    const participantResult = await testPool.query(
      'INSERT INTO participants (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      ['Test Preference User', 'test-preference-user@example.com', 'test-password']
    );
    testParticipantId = participantResult.rows[0].id;
    
    // Create test group
    const groupResult = await testPool.query(
      'INSERT INTO groups (name) VALUES ($1) RETURNING id',
      ['Test Preference Group']
    );
    testGroupId = groupResult.rows[0].id;
    
    // Check if preference_types table exists, create if not
    try {
      await testPool.query(`
        CREATE TABLE IF NOT EXISTS preference_types (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Check if participant_preferences table exists, create if not
      await testPool.query(`
        CREATE TABLE IF NOT EXISTS participant_preferences (
          id SERIAL PRIMARY KEY,
          participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
          preference_type_id INTEGER NOT NULL REFERENCES preference_types(id) ON DELETE CASCADE,
          value JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(participant_id, preference_type_id)
        )
      `);
      
      // Check if group_preferences table exists, create if not
      await testPool.query(`
        CREATE TABLE IF NOT EXISTS group_preferences (
          id SERIAL PRIMARY KEY,
          group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
          preference_type_id INTEGER NOT NULL REFERENCES preference_types(id) ON DELETE CASCADE,
          value JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(group_id, preference_type_id)
        )
      `);
      
      // Check if site_preferences table exists, create if not
      await testPool.query(`
        CREATE TABLE IF NOT EXISTS site_preferences (
          id SERIAL PRIMARY KEY,
          preference_type_id INTEGER NOT NULL REFERENCES preference_types(id) ON DELETE CASCADE,
          value JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(preference_type_id)
        )
      `);
      
      // Create test preference type or get existing one
      const preferenceTypeResult = await testPool.query(
        'SELECT id FROM preference_types WHERE name = $1',
        [TEST_PREFERENCE_TYPE.name]
      );
      
      if (preferenceTypeResult.rows.length > 0) {
        testPreferenceTypeId = preferenceTypeResult.rows[0].id;
      } else {
        const newPreferenceTypeResult = await testPool.query(
          'INSERT INTO preference_types (name, description) VALUES ($1, $2) RETURNING id',
          [TEST_PREFERENCE_TYPE.name, TEST_PREFERENCE_TYPE.description]
        );
        testPreferenceTypeId = newPreferenceTypeResult.rows[0].id;
      }
    } catch (error) {
      console.error('Error setting up preference tables:', error);
      throw error;
    }
  });
  
  // Clean up test data after all tests
  afterAll(async () => {
    try {
      // Clean up preferences
      await testPool.query('DELETE FROM participant_preferences WHERE participant_id = $1', [testParticipantId]);
      await testPool.query('DELETE FROM group_preferences WHERE group_id = $1', [testGroupId]);
      await testPool.query('DELETE FROM site_preferences WHERE preference_type_id = $1', [testPreferenceTypeId]);
      
      // Clean up preference type
      await testPool.query('DELETE FROM preference_types WHERE name = $1', [TEST_PREFERENCE_TYPE.name]);
      
      // Clean up participant and group
      await testPool.query('DELETE FROM participants WHERE id = $1', [testParticipantId]);
      await testPool.query('DELETE FROM groups WHERE id = $1', [testGroupId]);
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
    
    // Close the pool
    await testPool.end();
  });
  
  // Clean up preferences before each test
  beforeEach(async () => {
    await testPool.query('DELETE FROM participant_preferences WHERE participant_id = $1', [testParticipantId]);
    await testPool.query('DELETE FROM group_preferences WHERE group_id = $1', [testGroupId]);
    await testPool.query('DELETE FROM site_preferences WHERE preference_type_id = $1', [testPreferenceTypeId]);
  });
  
  describe('Preference Types', () => {
    it('retrieves a preference type by name', async () => {
      // Call the function
      const preferenceType = await getPreferenceTypeByName(TEST_PREFERENCE_TYPE.name);
      
      // Verify the result
      expect(preferenceType).toBeDefined();
      expect(preferenceType.id).toBe(testPreferenceTypeId);
      expect(preferenceType.name).toBe(TEST_PREFERENCE_TYPE.name);
      expect(preferenceType.description).toBe(TEST_PREFERENCE_TYPE.description);
    });
    
    it('returns null for non-existent preference type', async () => {
      // Call the function with a non-existent name
      const preferenceType = await getPreferenceTypeByName('non-existent-preference-type');
      
      // Verify the result
      expect(preferenceType).toBeNull();
    });
    
    it('retrieves all preference types', async () => {
      // Call the function
      const preferenceTypes = await getAllPreferenceTypes();
      
      // Verify the result
      expect(Array.isArray(preferenceTypes)).toBe(true);
      expect(preferenceTypes.length).toBeGreaterThan(0);
      
      // Find our test preference type
      const testType = preferenceTypes.find(type => type.id === testPreferenceTypeId);
      expect(testType).toBeDefined();
      expect(testType.name).toBe(TEST_PREFERENCE_TYPE.name);
    });
  });
  
  describe('Participant Preferences', () => {
    it('creates a participant preference', async () => {
      // Call the function
      const preference = await createParticipantPreference(
        testParticipantId,
        testPreferenceTypeId,
        TEST_PREFERENCE_VALUE
      );
      
      // Verify the result
      expect(preference).toBeDefined();
      expect(Number(preference.participant_id)).toBe(Number(testParticipantId));
      expect(Number(preference.preference_type_id)).toBe(Number(testPreferenceTypeId));
      expect(Number(preference.value)).toBe(Number(TEST_PREFERENCE_VALUE));
    });
    
    it('updates an existing participant preference', async () => {
      // Create initial preference
      await createParticipantPreference(
        testParticipantId,
        testPreferenceTypeId,
        TEST_PREFERENCE_VALUE
      );
      
      // Update with new value
      const updatedValue = 99;
      const updatedPreference = await createParticipantPreference(
        testParticipantId,
        testPreferenceTypeId,
        updatedValue
      );
      
      // Verify the result
      expect(updatedPreference).toBeDefined();
      expect(Number(updatedPreference.participant_id)).toBe(Number(testParticipantId));
      expect(Number(updatedPreference.preference_type_id)).toBe(Number(testPreferenceTypeId));
      expect(Number(updatedPreference.value)).toBe(Number(updatedValue));
      // BIGINT values don't have properties
    });
  });
  
  describe('Group Preferences', () => {
    it('creates a group preference', async () => {
      // Call the function
      const preference = await createGroupPreference(
        testGroupId,
        testPreferenceTypeId,
        TEST_PREFERENCE_VALUE
      );
      
      // Verify the result
      expect(preference).toBeDefined();
      expect(Number(preference.group_id)).toBe(Number(testGroupId));
      expect(Number(preference.preference_type_id)).toBe(Number(testPreferenceTypeId));
      expect(Number(preference.value)).toBe(Number(TEST_PREFERENCE_VALUE));
    });
    
    it('updates an existing group preference', async () => {
      // Create initial preference
      await createGroupPreference(
        testGroupId,
        testPreferenceTypeId,
        TEST_PREFERENCE_VALUE
      );
      
      // Update with new value
      const updatedValue = 99;
      const updatedPreference = await createGroupPreference(
        testGroupId,
        testPreferenceTypeId,
        updatedValue
      );
      
      // Verify the result
      expect(updatedPreference).toBeDefined();
      expect(Number(updatedPreference.group_id)).toBe(Number(testGroupId));
      expect(Number(updatedPreference.preference_type_id)).toBe(Number(testPreferenceTypeId));
      expect(Number(updatedPreference.value)).toBe(Number(updatedValue));
      // BIGINT values don't have properties
    });
  });
  
  describe('Site Preferences', () => {
    it('creates a site preference', async () => {
      // Call the function
      const preference = await createSitePreference(
        testPreferenceTypeId,
        TEST_PREFERENCE_VALUE
      );
      
      // Verify the result
      expect(preference).toBeDefined();
      expect(Number(preference.preference_type_id)).toBe(Number(testPreferenceTypeId));
      expect(Number(preference.value)).toBe(Number(TEST_PREFERENCE_VALUE));
    });
    
    it('updates an existing site preference', async () => {
      // Create initial preference
      await createSitePreference(
        testPreferenceTypeId,
        TEST_PREFERENCE_VALUE
      );
      
      // Update with new value
      const updatedValue = 99;
      const updatedPreference = await createSitePreference(
        testPreferenceTypeId,
        updatedValue
      );
      
      // Verify the result
      expect(updatedPreference).toBeDefined();
      expect(Number(updatedPreference.preference_type_id)).toBe(Number(testPreferenceTypeId));
      expect(Number(updatedPreference.value)).toBe(Number(updatedValue));
      // BIGINT values don't have properties
    });
  });
  
  describe('Preference Fallback', () => {
    it('retrieves participant preference when available', async () => {
      // Create preferences at all levels
      await createParticipantPreference(
        testParticipantId,
        testPreferenceTypeId,
        42
      );
      
      await createGroupPreference(
        testGroupId,
        testPreferenceTypeId,
        42
      );
      
      await createSitePreference(
        testPreferenceTypeId,
        42
      );
      
      // Call the function with participant and group IDs
      const preference = await getPreferenceWithFallback(
        TEST_PREFERENCE_TYPE.name,
        { participantId: testParticipantId, groupId: testGroupId }
      );
      
      // Verify the result - should get participant level
      expect(preference).toBeDefined();
      expect(preference.value).toBe(TEST_PREFERENCE_VALUE);
      expect(preference.source).toBe('participant');
    });
    
    it('falls back to group preference when participant preference not available', async () => {
      // Create preferences at group and site levels only
      await createGroupPreference(
        testGroupId,
        testPreferenceTypeId,
        42
      );
      
      await createSitePreference(
        testPreferenceTypeId,
        42
      );
      
      // Call the function with participant and group IDs
      const preference = await getPreferenceWithFallback(
        TEST_PREFERENCE_TYPE.name,
        { participantId: testParticipantId, groupId: testGroupId }
      );
      
      // Verify the result - should fall back to group level
      expect(preference).toBeDefined();
      expect(preference.value).toBe(TEST_PREFERENCE_VALUE);
      expect(preference.source).toBe('group');
    });
    
    it('falls back to site preference when participant and group preferences not available', async () => {
      // Create preference at site level only
      await createSitePreference(
        testPreferenceTypeId,
        42
      );
      
      // Call the function with participant and group IDs
      const preference = await getPreferenceWithFallback(
        TEST_PREFERENCE_TYPE.name,
        { participantId: testParticipantId, groupId: testGroupId }
      );
      
      // Verify the result - should fall back to site level
      expect(preference).toBeDefined();
      expect(preference.value).toBe(TEST_PREFERENCE_VALUE);
      expect(preference.source).toBe('site');
    });
    
    it('returns default value when no preferences are available', async () => {
      // Call the function with participant and group IDs but no preferences exist
      const preference = await getPreferenceWithFallback(
        TEST_PREFERENCE_TYPE.name,
        { participantId: testParticipantId, groupId: testGroupId }
      );
      
      // Verify the result - should use default
      expect(preference).toBeDefined();
      expect(preference.source).toBe('default');
      expect(preference.value).toEqual(null);
    });
  });
});
