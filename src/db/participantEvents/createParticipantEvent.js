/**
 * @file src/db/participantEvents/createParticipantEvent.js
 * @description Creates a new participant event record in the database.
 */

import { pool } from '../connection.js';

/**
 * Creates a new participant event in the database
 * @param {number} participantId - The ID of the participant
 * @param {number} eventTypeId - The ID of the event type
 * @param {object} [details=null] - Optional JSON details about the event
 * @param {object} [customPool=pool] - Database connection pool (for testing)
 * @returns {Promise<object>} The newly created participant event record
 * @throws {Error} If an error occurs during creation
 */
export async function createParticipantEvent(participantId, eventTypeId, details = null, customPool = pool) {
  try {
    const query = `
      INSERT INTO public.participant_events
        (participant_id, event_type_id, details)
      VALUES ($1, $2, $3)
      RETURNING id, participant_id, event_type_id, details, created_at
    `;
    const values = [participantId, eventTypeId, details];

    const { rows } = await customPool.query(query, values);
    return rows[0];
  } catch (error) {
    throw new Error(`Failed to create participant event: ${error.message}`);
  }
}