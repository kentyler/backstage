// src/db/grpConTemplateTopics/createGrpConTemplateTopic.js
/**
 * @file src/db/grpConTemplateTopics/createGrpConTemplateTopic.js
 * @description Creates a new topic for a template.
 */

/**
 * Inserts a new row into grp_con_template_topics.
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @param {number} templateId - The ID of the template
 * @param {string} title - The title of the topic
 * @param {string} content - The content of the topic (can be empty)
 * @param {number} topicIndex - The index of the topic for ordering
 * @param {object|string} [customPoolOrSchema=null] - Database connection pool or schema name
 * @returns {Promise<{id: number, template_id: number, title: string, content: string, topic_index: number}>}
 */
export async function createGrpConTemplateTopic(templateId, title, content, topicIndex, pool) {
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
    INSERT INTO grp_con_template_topics
      (template_id, title, content, topic_index)
    VALUES ($1, $2, $3, $4)
    RETURNING id, template_id, title, content, topic_index
  `;
  const { rows } = await customPool.query(query, [templateId, title, content, topicIndex]);
  return rows[0];
}