// test/participantEvents.test.js

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { pool } from '../src/db/connection.js';
import {
  createParticipantEvent,
  getParticipantEventById,
  getParticipantEventsByParticipant,
  getParticipantEventsByType
} from '../src/db/participantEvents';

// Assuming a test participant with ID=1 exists in the test database
const TEST_PARTICIPANT_ID = 1;
// Using the 'login' event type (ID=2) from the initial event types
const TEST_EVENT_TYPE_ID = 2;
// Sample event details
const TEST_EVENT_DETAILS = { ip: '192.168.1.1', userAgent: 'Test Browser' };

let eventId;

/** Helper to clean up test events */
async function cleanupEvents() {
  if (eventId) {
    await pool.query(
      `DELETE FROM public.participant_events
       WHERE id = $1`,
      [eventId]
    );
    eventId = null;
  }
}

describe('Participant Events', () => {
  // Clean up any leftover test data before starting
  beforeEach(async () => {
    await cleanupEvents();
  });

  // Clean up after each test
  afterEach(async () => {
    await cleanupEvents();
  });

  it('creates a participant event', async () => {
    const event = await createParticipantEvent(
      TEST_PARTICIPANT_ID,
      TEST_EVENT_TYPE_ID,
      TEST_EVENT_DETAILS
    );
    
    // Save the event ID for cleanup
    eventId = event.id;
    
    // Verify the created event
    expect(event).toHaveProperty('id');
    expect(event).toHaveProperty('participant_id', TEST_PARTICIPANT_ID);
    expect(event).toHaveProperty('event_type_id', TEST_EVENT_TYPE_ID);
    expect(event).toHaveProperty('details', TEST_EVENT_DETAILS);
    expect(event).toHaveProperty('created_at');
  });

  it('retrieves a participant event by ID', async () => {
    // Create an event first
    const createdEvent = await createParticipantEvent(
      TEST_PARTICIPANT_ID,
      TEST_EVENT_TYPE_ID,
      TEST_EVENT_DETAILS
    );
    eventId = createdEvent.id;
    
    // Retrieve the event by ID
    const event = await getParticipantEventById(eventId);
    
    // Verify the retrieved event
    expect(event).toHaveProperty('id', eventId);
    expect(event).toHaveProperty('participant_id', TEST_PARTICIPANT_ID);
    expect(event).toHaveProperty('event_type_id', TEST_EVENT_TYPE_ID);
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
      TEST_PARTICIPANT_ID,
      TEST_EVENT_TYPE_ID,
      TEST_EVENT_DETAILS
    );
    eventId = createdEvent.id;
    
    // Retrieve events for the participant
    const events = await getParticipantEventsByParticipant(TEST_PARTICIPANT_ID);
    
    // Verify the events list
    expect(Array.isArray(events)).toBe(true);
    
    // Find our test event in the results
    const testEvent = events.find(e => e.id === eventId);
    expect(testEvent).toBeDefined();
    expect(testEvent).toHaveProperty('participant_id', TEST_PARTICIPANT_ID);
    expect(testEvent).toHaveProperty('event_type_id', TEST_EVENT_TYPE_ID);
    expect(testEvent).toHaveProperty('details', TEST_EVENT_DETAILS);
    
    // Check for event_type_name if it exists (it might be null if the event type doesn't exist)
    if (testEvent.event_type_name) {
      expect(testEvent.event_type_name).toBe('login');
    }
  });

  it('retrieves events by type', async () => {
    // Create an event first
    const createdEvent = await createParticipantEvent(
      TEST_PARTICIPANT_ID,
      TEST_EVENT_TYPE_ID,
      TEST_EVENT_DETAILS
    );
    eventId = createdEvent.id;
    
    // Retrieve events for the event type
    const events = await getParticipantEventsByType(TEST_EVENT_TYPE_ID);
    
    // Verify the events list
    expect(Array.isArray(events)).toBe(true);
    
    // Find our test event in the results
    const testEvent = events.find(e => e.id === eventId);
    expect(testEvent).toBeDefined();
    expect(testEvent).toHaveProperty('participant_id', TEST_PARTICIPANT_ID);
    expect(testEvent).toHaveProperty('event_type_id', TEST_EVENT_TYPE_ID);
    expect(testEvent).toHaveProperty('details', TEST_EVENT_DETAILS);
    
    // Check that participant info is included (from the join)
    expect(testEvent).toHaveProperty('participant_name');
    expect(testEvent).toHaveProperty('participant_email');
  });

  it('handles errors gracefully', async () => {
    // Test with invalid parameters to trigger an error
    await expect(
      createParticipantEvent(null, TEST_EVENT_TYPE_ID, TEST_EVENT_DETAILS)
    ).rejects.toThrow();
  });
});