// src/db/grpConTemplateTopics/updateGrpConTemplateTopic.js
/**
 * @file src/db/grpConTemplateTopics/updateGrpConTemplateTopic.js
 * @description Updates an existing template topic.
 */
import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Updates a template topic.
 *
 * @param {number} topicId - The ID of the topic to update
 * @param {string} title - The updated title
 * @param {string} content - The updated content
 * @param {number} topicIndex - The updated topic index
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<{id: number, template_id: number, title: string, content: string, topic_index: number}|null>}
 */
export async function updateGrpConTemplateTopic(topicId, title, content, topicIndex, customPoolOrSchema = null) {
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
    UPDATE grp_con_template_topics
    SET title = $2, content = $3, topic_index = $4
    WHERE id = $1
    RETURNING id, template_id, title, content, topic_index
  `;
  const { rows } = await customPool.query(query, [topicId, title, content, topicIndex]);
  return rows.length > 0 ? rows[0] : null;
}