/**
 * @file src/db/participant/updateParticipant.js
 * @description Updates a participant's information in the database.
 */

/**
 * The database connection pool
 */
import { pool } from '../connection.js';
/**
 * Updates a participant's information
 * @param {number} id - The ID of the participant to update
 * @param {object} updates - Object containing fields to update
 * @param {string} [updates.name] - Updated name
 * @param {string} [updates.email] - Updated email
 * @param {string} [updates.password] - Updated password (should be hashed)
 * @param {number} [createdByParticipantId=null] - ID of participant making the change (for logging)
 * @returns {Promise<object|null>} The updated participant record, or null if not found
 * @throws {Error} If email already exists or another error occurs
 */
export async function updateParticipant(id, updates, createdByParticipantId = null) {
  try {
    // Check if the participant exists
    const existingParticipant = await pool.query(
      'SELECT * FROM participants WHERE id = $1',
      [id]
    );

    if (existingParticipant.rows.length === 0) {
      return null;
    }

    // Check if email exists (if updating email)
    if (updates.email) {
      const existingEmail = await pool.query(
        'SELECT id FROM participants WHERE email = $1 AND id != $2',
        [updates.email, id]
      );

      if (existingEmail.rows.length > 0) {
        throw new Error(`Participant with email ${updates.email} already exists`);
      }
    }

    // Build dynamic update query
    const setStatements = [];
    const values = [];
    let paramCount = 1;

    // Add fields to update
    if (updates.name !== undefined) {
      setStatements.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }

    if (updates.email !== undefined) {
      setStatements.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }

    if (updates.password !== undefined) {
      setStatements.push(`password = $${paramCount++}`);
      values.push(updates.password);
    }

    // current_avatar_id and llm_id fields have been removed from the participants table
    // These are now handled through the preferences system

    // Return if no fields to update
    if (setStatements.length === 0) {
      return existingParticipant.rows[0];
    }

    // Add ID as the last parameter
    values.push(id);

    // Construct final query
    const query = `
      UPDATE participants
      SET ${setStatements.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    // Execute update
    const result = await pool.query(query, values);
    
    // No longer need to create participant-avatar relationship here
    // This is now handled through the preferences system
    
    return result.rows[0];
  } catch (error) {
    throw new Error(`Failed to update participant: ${error.message}`);
  }
}