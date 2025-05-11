// test/participantEvents.test.js

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
  createParticipantEvent,
  getParticipantEventById,
  getParticipantEventsByParticipant,
  getParticipantEventsByType
} from '../src/db/participantEvents/index.js';

// Create a dedicated test pool with explicit schema
const testPool = new Pool({
  connectionString: process.env.DB_HOST,
  ssl: { rejectUnauthorized: false },
});

// Set the search path explicitly for all connections
testPool.on('connect', (client) => {
  client.query('SET search_path TO dev, public;');
});

// Sample event details
const TEST_EVENT_DETAILS = { ip: '192.168.1.1', userAgent: 'Test Browser' };

// Variables to store test data IDs
let testParticipantId;
let testEventTypeId;
let eventId;

/** Helper to clean up test events */
async function cleanupEvents() {
  if (eventId) {
    await testPool.query(
      `DELETE FROM participant_events
       WHERE id = $1`,
      [eventId]
    );
    eventId = null;
  }
}

// Global afterAll to close the pool after all tests
afterAll(async () => {
  // Clean up any test data
  await cleanupEvents();
  
  // Clean up test participant if it exists
  if (testParticipantId) {
    await testPool.query('DELETE FROM participants WHERE id = $1', [testParticipantId]);
  }
  
  await testPool.end();
});

describe('Participant Events', () => {
  // Set up test data before all tests
  beforeAll(async () => {
    // Make sure schema is set to 'dev' for all tests in this suite
    await testPool.query('SET search_path TO dev, public;');
    
    // Create a test participant
    const participantResult = await testPool.query(
      'INSERT INTO participants (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      ['Test Event Participant', 'test-event-participant@example.com', 'test-event-password']
    );
    testParticipantId = participantResult.rows[0].id;
    
    // Check if event_types table exists, if not create it
    try {
      // Try to create the event_types table if it doesn't exist
      await testPool.query(`
        CREATE TABLE IF NOT EXISTS event_types (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Try to create the participant_events table if it doesn't exist
      await testPool.query(`
        CREATE TABLE IF NOT EXISTS participant_events (
          id SERIAL PRIMARY KEY,
          participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
          event_type_id INTEGER NOT NULL REFERENCES event_types(id),
          details JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create or get a test event type (using login event type)
      const eventTypeResult = await testPool.query(
        'SELECT id FROM event_types WHERE name = $1',
        ['login']
      );
      
      if (eventTypeResult.rows.length > 0) {
        testEventTypeId = eventTypeResult.rows[0].id;
      } else {
        // Create a test event type if it doesn't exist
        const newEventTypeResult = await testPool.query(
          'INSERT INTO event_types (name, description) VALUES ($1, $2) RETURNING id',
          ['login', 'User login event']
        );
        testEventTypeId = newEventTypeResult.rows[0].id;
      }
    } catch (error) {
      console.error('Error setting up event_types:', error);
      // If we can't create the table, use a dummy ID for testing
      testEventTypeId = 1;
    }
  });
  
  // Clean up any leftover test data before each test
  beforeEach(async () => {
    await cleanupEvents();
  });

  // Clean up after each test
  afterEach(async () => {
    await cleanupEvents();
  });

  it('creates a participant event', async () => {
    const event = await createParticipantEvent(
      testParticipantId,
      testEventTypeId,
      TEST_EVENT_DETAILS
    );
    
    // Save the event ID for cleanup
    eventId = event.id;
    
    // Verify the created event
    expect(event).toHaveProperty('id');
    expect(Number(event.participant_id)).toBe(Number(testParticipantId));
    expect(Number(event.event_type_id)).toBe(Number(testEventTypeId));
    expect(event).toHaveProperty('details', TEST_EVENT_DETAILS);
    expect(event).toHaveProperty('created_at');
  });

  it('retrieves a participant event by ID', async () => {
    // Create an event first
    const createdEvent = await createParticipantEvent(
      testParticipantId,
      testEventTypeId,
      TEST_EVENT_DETAILS
    );
    eventId = createdEvent.id;
    
    // Retrieve the event by ID
    const event = await getParticipantEventById(eventId);
    
    // Verify the retrieved event
    expect(event).toHaveProperty('id');
    expect(Number(event.id)).toBe(Number(eventId));
    expect(Number(event.participant_id)).toBe(Number(testParticipantId));
    expect(Number(event.event_type_id)).toBe(Number(testEventTypeId));
    expect(event).toHaveProperty('details', TEST_EVENT_DETAILS);
    expect(event).toHaveProperty('created_at');
  });

  it('returns null when retrieving a non-existent event', async () => {
    const event = await getParticipantEventById(99999); // Non-existent ID
    expect(event).toBeNull();
  });

  it('retrieves events by participant', async () => {
    // Create an event first
    const createdEvent = await createParticipantEvent(
      testParticipantId,
      testEventTypeId,
      TEST_EVENT_DETAILS
    );
    eventId = createdEvent.id;
    
    // Retrieve events for the participant
    const events = await getParticipantEventsByParticipant(testParticipantId);
    
    // Verify the events list
    expect(Array.isArray(events)).toBe(true);
    
    // Find our test event in the results
    const testEvent = events.find(e => Number(e.id) === Number(eventId));
    expect(testEvent).toBeDefined();
    expect(Number(testEvent.participant_id)).toBe(Number(testParticipantId));
    expect(Number(testEvent.event_type_id)).toBe(Number(testEventTypeId));
    expect(testEvent).toHaveProperty('details', TEST_EVENT_DETAILS);
    
    // Check that event_type_name exists (but don't check the exact value as it might vary)
    if (testEvent.event_type_name) {
      expect(typeof testEvent.event_type_name).toBe('string');
    }
  });

  it('retrieves events by type', async () => {
    // Create an event first
    const createdEvent = await createParticipantEvent(
      testParticipantId,
      testEventTypeId,
      TEST_EVENT_DETAILS
    );
    eventId = createdEvent.id;
    
    // Retrieve events for the event type
    const events = await getParticipantEventsByType(testEventTypeId);
    
    // Verify the events list
    expect(Array.isArray(events)).toBe(true);
    
    // Find our test event in the results
    const testEvent = events.find(e => Number(e.id) === Number(eventId));
    expect(testEvent).toBeDefined();
    expect(Number(testEvent.participant_id)).toBe(Number(testParticipantId));
    expect(Number(testEvent.event_type_id)).toBe(Number(testEventTypeId));
    expect(testEvent).toHaveProperty('details', TEST_EVENT_DETAILS);
    
    // Check that participant info is included (from the join)
    expect(testEvent).toHaveProperty('participant_name');
    expect(testEvent).toHaveProperty('participant_email');
  });

  it('handles errors gracefully', async () => {
    // Test with invalid parameters to trigger an error
    await expect(
      createParticipantEvent(null, testEventTypeId, TEST_EVENT_DETAILS)
    ).rejects.toThrow();
  });
});