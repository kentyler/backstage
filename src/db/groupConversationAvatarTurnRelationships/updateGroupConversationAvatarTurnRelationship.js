// updateGroupConversationAvatarTurnRelationship.js
import { pool } from '../connection.js';

/**
 * Updates the relationship type of an existing relationship.
 * @param {number} id
 * @param {number} newTypeId
 * @returns {Promise<object|null>}
 */
export async function updateGroupConversationAvatarTurnRelationship(id, newTypeId) {
  const sql = `
    UPDATE public.group_conversation_avatar_turn_relationships
       SET turn_relationship_type_id = $2
     WHERE id = $1
     RETURNING id, turn_id, target_turn_id, turn_relationship_type_id, created_at
  `;
  const { rows } = await pool.query(sql, [id, newTypeId]);
  return rows[0] || null;
}