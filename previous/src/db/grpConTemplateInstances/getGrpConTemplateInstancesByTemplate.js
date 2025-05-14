// src/db/grpConTemplateInstances/getGrpConTemplateInstancesByTemplate.js
/**
 * @file src/db/grpConTemplateInstances/getGrpConTemplateInstancesByTemplate.js
 * @description Lists all instances for a given template.
 */

/**
 * Fetches template instances for one template.
 * @param {Pool} pool - The PostgreSQL connection pool.
 * @param {number} templateId - The ID of the template
 * @returns {Promise<Array<{id: number, template_id: number, group_id: number, name: string, description: string, created_at: Date}>>}
 */
export async function getGrpConTemplateInstancesByTemplate(templateId, pool) {
  const query = `
    SELECT id, template_id, group_id, name, description, created_at
    FROM grp_con_template_instances
    WHERE template_id = $1
    ORDER BY created_at DESC
  `;
  
  const { rows } = await pool.query(query, [templateId]);
  return rows;
}
