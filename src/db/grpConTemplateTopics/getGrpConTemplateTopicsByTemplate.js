// src/db/grpConTemplateTopics/getGrpConTemplateTopicsByTemplate.js
/**
 * @file src/db/grpConTemplateTopics/getGrpConTemplateTopicsByTemplate.js
 * @description Lists all topics for a given template, ordered by topic_index.
 */
import { pool, createPool } from '../connection.js';
import { getDefaultSchema } from '../../config/schema.js';

/**
 * Fetches topic entries for one template.
 *
 * @param {number} templateId - The ID of the template
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<Array<{id: number, template_id: number, title: string, content: string, topic_index: number}>>}
 */
export async function getGrpConTemplateTopicsByTemplate(templateId, customPoolOrSchema = null) {
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
    WHERE template_id = $1
    ORDER BY topic_index
  `;
  const { rows } = await customPool.query(query, [templateId]);
  return rows;
}