// src/db/grpConAvatarTurns/getGrpConAvatarTurnsByConversation.js
import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Parse a vector string from the database into an array of numbers
 * 
 * @param {string} vectorStr - The vector string from the database (e.g., "[0.1,0.2,0.3]")
 * @returns {number[]} The parsed vector as an array of numbers
 */
function parseVectorString(vectorStr) {
  if (!vectorStr) return [];
  
  try {
    // Remove the square brackets and split by comma
    const vectorString = vectorStr.replace(/^\[|\]$/g, '');
    return vectorString.split(',').map(Number);
  } catch (error) {
    console.error('Error parsing vector string:', error);
    return [];
  }
}

/**
 * Get all avatar turns for a specific conversation
 * 
 * @param {number} conversationId - The ID of the conversation
 * @param {string|object} [schemaOrPool=null] - Schema name or custom pool
 * @returns {Promise<Array>} List of avatar turns for the conversation
 */
export async function getGrpConAvatarTurnsByConversation(conversationId, schemaOrPool = null) {
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
    // Use default schema if no schema or pool is provided
    const defaultSchema = getDefaultSchema();
    if (defaultSchema !== 'public') {
      customPool = createPool(defaultSchema);
    }
  }
  
  const query = `
    SELECT id, grp_con_id, avatar_id, turn_index, content_text, content_vector, created_at, turn_kind_id, message_type_id
      FROM grp_con_avatar_turns
     WHERE grp_con_id = $1
  ORDER BY turn_index
  `;
  
  try {
    const { rows } = await customPool.query(query, [conversationId]);
    
    // Process each row to convert content_vector from string to array
    return rows.map(row => {
      // Parse the content_vector if it exists
      if (row.content_vector) {
        // Add the embedding property for backward compatibility
        row.embedding = parseVectorString(row.content_vector);
        
        // Also update content_vector to be an array
        row.content_vector = row.embedding;
      } else {
        row.embedding = [];
        row.content_vector = [];
      }
      
      // Add the content property for backward compatibility
      row.content = row.content_text;
      
      return row;
    });
  } catch (error) {
    console.error('Error getting turns by conversation:', error);
    return [];
  }
}
