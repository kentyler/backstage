// src/db/groupConversations/getGroupConversationById.js
import { pool } from '../connection.js';

/**
 * Retrieves a conversation by its ID.
 * @param {number} id - The conversation ID.
 * @returns {Promise<{id: number, group_id: number, name: string, description: string, created_at: string}|null>}
 */
export async function getGroupConversationById(id) {
  const query = `
    SELECT id, group_id, name, description, created_at
      FROM public.group_conversations
     WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}