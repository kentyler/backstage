// src/db/grConAvatarTurn/getAvatarTurnsByConversation.js
import { pool } from '../connection.js';

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

export async function getGrpConAvatarTurnsByConversation(conversationId) {
  const query = `
    SELECT id, grp_con_id, avatar_id, turn_index, content_text, content_vector, created_at
      FROM public.grp_con_avatar_turns
     WHERE grp_con_id = $1
  ORDER BY turn_index
  `;
  
  try {
    const { rows } = await pool.query(query, [conversationId]);
    
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
