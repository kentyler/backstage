// src/db/grpConTemplateTopics/getGrpConTemplateTopicById.js
/**
 * @file src/db/grpConTemplateTopics/getGrpConTemplateTopicById.js
 * @description Retrieves a single template topic by its ID.
 */
import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Fetches a single template topic by ID.
 *
 * @param {number} topicId - The ID of the topic to retrieve
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<{id: number, template_id: number, title: string, content: string, topic_index: number}|null>}
 */
export async function getGrpConTemplateTopicById(topicId, customPoolOrSchema = null) {
  // Determine which pool to use
  let customPool = pool;
  
  if (customPoolOrSchema) {
    if (typeof customPoolOrSchema === 'string') {
      // If a schema name is provided, create a pool for that schema
      customPool = createPool(customPoolOrSchema);
    } else {
      // If a pool object is provided, use it
      customPool = customPoolOrSchema;
    }
  } else {
    // Use default schema if no schema or pool is provided
    const defaultSchema = getDefaultSchema();
    if (defaultSchema !== 'public') {
      customPool = createPool(defaultSchema);
    }
  }

  const query = `
    SELECT id, template_id, title, content, topic_index
    FROM grp_con_template_topics
    WHERE id = $1
  `;
  const { rows } = await customPool.query(query, [topicId]);
  return rows.length > 0 ? rows[0] : null;
}