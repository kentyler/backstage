// src/db/groupConversations/getGroupConversationsByGroup.js
import { pool } from '../connection.js';

/**
 * Retrieves all conversations for a given group.
 * @param {number} groupId - The group ID.
 * @returns {Promise<Array<{id: number, group_id: number, name: string, description: string, created_at: string}>>}
 */
export async function getGroupConversationsByGroup(groupId) {
  const query = `
    SELECT id, group_id, name, description, created_at
      FROM public.group_conversations
     WHERE group_id = $1
  ORDER BY id
  `;
  const result = await pool.query(query, [groupId]);
  return result.rows;
}