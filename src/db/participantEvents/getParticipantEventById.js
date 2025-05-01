/**
 * @file src/db/participantEvents/getParticipantEventById.js
 * @description Retrieves a participant event by its ID.
 */

import { pool } from '../connection.js';

/**
 * Retrieves a participant event by its ID
 * @param {number} id - The ID of the participant event to retrieve
 * @param {object} [customPool=pool] - Database connection pool (for testing)
 * @returns {Promise<object|null>} The participant event record or null if not found
 * @throws {Error} If an error occurs during retrieval
 */
export async function getParticipantEventById(id, customPool = pool) {
  try {
    const query = `
      SELECT id, participant_id, event_type_id, details, created_at
      FROM public.participant_events
      WHERE id = $1
    `;
    const { rows } = await customPool.query(query, [id]);
    return rows[0] || null;
  } catch (error) {
    throw new Error(`Failed to retrieve participant event: ${error.message}`);
  }
}