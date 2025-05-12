// src/db/grpConTemplateTopics/getGrpConTemplateTopicsByTemplate.js
/**
 * @file src/db/grpConTemplateTopics/getGrpConTemplateTopicsByTemplate.js
 * @description Lists all topics for a given template, ordered by topic_index.
 */

/**
 * Fetches topic entries for one template.
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @param {number} templateId - The ID of the template
 * @returns {Promise<Array<{id: number, template_id: number, title: string, content: string, topic_index: number}>>}
 */
export async function getGrpConTemplateTopicsByTemplate(templateId, pool) {
  
  const query = `
    SELECT id, template_id, title, content, topic_index
    FROM grp_con_template_topics
    WHERE template_id = $1
    ORDER BY topic_index
  `;
  const { rows } = await pool.query(query, [templateId]);
  return rows;
}