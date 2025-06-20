/**
 * Gets a single turn by its ID
 * @param {number} turnId - The ID of the turn to retrieve
 * @param {Object} pool - Database connection pool to use
 * @param {Object} [client] - Optional database client (for transactions)
 * @returns {Promise<Object|null>} The turn object or null if not found
 */
export async function getTurnById(turnId, pool, client = null) {
  const query = `
    SELECT 
      id,
      topic_id,
      participant_id,
      content_text,
      content_vector,
      message_type_id,
      turn_kind_id,
      created_at,
      turn_index,
      llm_id
    FROM participant_topic_turns
    WHERE id = $1
  `;

  try {
    const result = await (client || pool).query(query, [turnId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting turn by ID:', error);
    throw error;
  }
}

export default getTurnById;
