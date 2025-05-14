// src/db/grpConTemplateTopics/updateGrpConTemplateTopic.js
/**
 * @file src/db/grpConTemplateTopics/updateGrpConTemplateTopic.js
 * @description Updates an existing template topic.
 */

/**
 * Updates a template topic.
 * @param { Pool } pool - The PostgreSQL connection pool.
 * @param {number} topicId - The ID of the topic to update
 * @param {string} title - The updated title
 * @param {string} content - The updated content
 * @param {number} topicIndex - The updated topic index
 ** @returns {Promise<{id: number, template_id: number, title: string, content: string, topic_index: number}|null>}
 */
export async function updateGrpConTemplateTopic(topicId, title, content, topicIndex, pool) {
  
  const query = `
    UPDATE grp_con_template_topics
    SET title = $2, content = $3, topic_index = $4
    WHERE id = $1
    RETURNING id, template_id, title, content, topic_index
  `;
  const { rows } = await pool.query(query, [topicId, title, content, topicIndex]);
  return rows.length > 0 ? rows[0] : null;
}