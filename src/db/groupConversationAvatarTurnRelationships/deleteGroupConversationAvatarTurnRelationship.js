// deleteGroupConversationAvatarTurnRelationship.js
import { pool } from '../connection.js';

/**
 * Deletes a relationship by its ID.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function deleteGroupConversationAvatarTurnRelationship(id) {
  const sql = `
    DELETE FROM public.group_conversation_avatar_turn_relationships
     WHERE id = $1
  `;
  const { rowCount } = await pool.query(sql, [id]);
  return rowCount > 0;
}