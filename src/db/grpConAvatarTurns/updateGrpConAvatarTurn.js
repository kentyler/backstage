// src/db/grpConAvatarTurns/updateGrpConAvatarTurn.js
import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

const VECTOR_DIM = 1536;
function normalizeVector(arr) { /* same as above */ }
function toVectorLiteral(arr) { /* same as above */ }

/**
 * Update a group conversation avatar turn
 * @param {number} id - The ID of the turn to update
 * @param {string} newText - The new text content
 * @param {Array<number>} newVector - The new vector content
 * @param {string|object} schemaOrPool - Either a schema name or a pool object
 * @returns {Promise<object>} The updated turn
 */
export async function updateGrpConAvatarTurn(id, newText, newVector, schemaOrPool = null) {
  // Determine which pool to use
  let customPool = pool;
  if (schemaOrPool) {
    if (typeof schemaOrPool === 'string') {
      // If a schema name is provided, create a pool for that schema
      customPool = createPool(schemaOrPool);
    } else {
      // If a pool object is provided, use it
      customPool = schemaOrPool;
    }
  } else {
    // If no schema or pool is provided, use the default schema
    customPool = createPool(getDefaultSchema());
  }

  const normalized = normalizeVector(newVector);
  const vecLit     = toVectorLiteral(normalized);
  const query = `
    UPDATE grp_con_avatar_turns
       SET content_text = $2,
           content_vector = $3::vector
     WHERE id = $1
     RETURNING id, grp_con_id, avatar_id, turn_index, content_text, content_vector, created_at
  `;
  const { rows } = await customPool.query(query, [id, newText, vecLit]);
  const row = rows[0] || null;
  if (row) row.content_vector = normalized;
  return row;
}
