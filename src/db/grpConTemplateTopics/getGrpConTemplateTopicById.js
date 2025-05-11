// src/db/grpConTemplateTopics/getGrpConTemplateTopicById.js
/**
 * @file src/db/grpConTemplateTopics/getGrpConTemplateTopicById.js
 * @description Retrieves a single template topic by its ID.
 */
import { pool } from '../connection.js';

/**
 * Fetches a single template topic by ID.
 *
 * @param {number} topicId - The ID of the topic to retrieve
 * @returns {Promise<{id: number, template_id: number, title: string, content: string, topic_index: number}|null>}
 */
export async function getGrpConTemplateTopicById(topicId) {
  
  const query = `
    SELECT id, template_id, title, content, topic_index
    FROM grp_con_template_topics
    WHERE id = $1
  `;
  const { rows } = await pool.query(query, [topicId]);
  return rows.length > 0 ? rows[0] : null;
}