/**
 * @file src/db/participant/updateParticipant.js
 * @description Updates a participant's information in the database.
 */

/**
 * The database connection pool
 */
import { pool as defaultPool } from '../connection.js';
import { createParticipantAvatar } from '../participantAvatars/createParticipantAvatar.js';

/**
 * Updates a participant's information
 * @param {number} id - The ID of the participant to update
 * @param {object} updates - Object containing fields to update
 * @param {string} [updates.name] - Updated name
 * @param {string} [updates.email] - Updated email
 * @param {string} [updates.password] - Updated password (should be hashed)
 * @param {number} [updates.current_avatar_id] - Updated avatar ID
 * @param {number} [updates.llm_id] - Updated LLM configuration ID
 * @param {number} [createdByParticipantId=null] - ID of participant making the change (for logging)
 * @param {object} [pool=defaultPool] - Database connection pool (for testing)
 * @returns {Promise<object|null>} The updated participant record, or null if not found
 * @throws {Error} If email already exists or another error occurs
 */
export async function updateParticipant(id, updates, createdByParticipantId = null, pool = defaultPool) {
  try {
    // Check if the participant exists
    const existingParticipant = await pool.query(
      'SELECT * FROM public.participants WHERE id = $1',
      [id]
    );

    if (existingParticipant.rows.length === 0) {
      return null;
    }

    // Check if email exists (if updating email)
    if (updates.email) {
      const existingEmail = await pool.query(
        'SELECT id FROM public.participants WHERE email = $1 AND id != $2',
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

    if (updates.current_avatar_id !== undefined) {
      setStatements.push(`current_avatar_id = $${paramCount++}`);
      values.push(updates.current_avatar_id);
    }

    if (updates.llm_id !== undefined) {
      setStatements.push(`llm_id = $${paramCount++}`);
      values.push(updates.llm_id);
    }

    // Return if no fields to update
    if (setStatements.length === 0) {
      return existingParticipant.rows[0];
    }

    // Add ID as the last parameter
    values.push(id);

    // Construct final query
    const query = `
      UPDATE public.participants
      SET ${setStatements.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    // Execute update
    const result = await pool.query(query, values);
    
    // If current_avatar_id was updated, create a record in participant_avatars table
    if (updates.current_avatar_id !== undefined && result.rows[0]) {
      try {
        await createParticipantAvatar(
          id, 
          updates.current_avatar_id,
          createdByParticipantId || id, // If no creator specified, use the participant's own ID
          pool
        );
      } catch (avatarError) {
        console.error(`Failed to create participant-avatar relationship: ${avatarError.message}`);
        // Continue with the update even if logging fails
      }
    }
    
    return result.rows[0];
  } catch (error) {
    throw new Error(`Failed to update participant: ${error.message}`);
  }
}