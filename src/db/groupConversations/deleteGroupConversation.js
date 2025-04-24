// src/db/groupConversations/deleteGroupConversation.js
import { pool } from '../connection.js';

/**
 * Deletes a conversation by its ID.
 * @param {number} id - The conversation ID.
 * @returns {Promise<boolean>} True if deleted, false otherwise.
 */
export async function deleteGroupConversation(id) {
  const query = `
    DELETE FROM public.group_conversations
     WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rowCount > 0;
}