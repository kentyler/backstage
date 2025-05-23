/**
 * @file db/llm/preferences/getClientSchemaPreference.js
 * @description Gets preference value for a client schema
 */

/**
 * Gets preference value for a client schema
 * @param {number} clientSchemaId - The client schema ID
 * @param {number} preferenceTypeId - The preference type ID
 * @param {Object} pool - The database connection pool
 * @returns {Promise<Object>} The preference value
 */
export async function getClientSchemaPreference(clientSchemaId, preferenceTypeId, pool) {
  try {
    const prefQuery = `
      SELECT preference_value, preference_type_id, 
             pg_typeof(preference_value) as value_type
      FROM client_schema_preferences 
      WHERE client_schema_id = $1 AND preference_type_id = $2;
    `;
    
    const { rows } = await pool.query(prefQuery, [clientSchemaId, preferenceTypeId]);
    console.log('Client schema preference details:', {
      preferences: rows,
      valueType: rows[0]?.value_type,
      rawValue: rows[0]?.preference_value
    });
    
    if (!rows || rows.length === 0) {
      return null;
    }
    
    return rows[0];
  } catch (error) {
    console.error('Error getting client schema preference:', error);
    throw error;
  }
}
