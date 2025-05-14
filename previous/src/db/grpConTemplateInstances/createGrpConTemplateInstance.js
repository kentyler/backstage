// src/db/grpConTemplateInstances/createGrpConTemplateInstance.js
/**
 * @file src/db/grpConTemplateInstances/createGrpConTemplateInstance.js
 * @description Creates a new template instance.
 */

/**
 * Creates a new template instance.
 * @param {number} templateId - The ID of the template
 * @param {number} groupId - The ID of the group
 * @param {string} name - The name of the instance (optional, defaults to template name with timestamp)
 * @param {string} description - The description of the instance (optional)
 * @param {Pool} pool - The PostgreSQL connection pool
 * @returns {Promise<{id: number, template_id: number, group_id: number, name: string, description: string, created_at: Date}>}
 */
export async function createGrpConTemplateInstance(templateId, groupId, name = null, description = null, pool) {
  // First, get the template info if name is not provided
  let templateName = name;
  if (!templateName) {
    const templateQuery = `
      SELECT name FROM grp_con_templates WHERE id = $1
    `;
    const templateResult = await pool.query(templateQuery, [templateId]);
    if (templateResult.rows.length === 0) {
      throw new Error(`Template with ID ${templateId} not found`);
    }
    
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    templateName = `${templateResult.rows[0].name} - ${timestamp}`;
  }
  
  const query = `
    INSERT INTO grp_con_template_instances (
      template_id, 
      group_id, 
      name, 
      description, 
      created_at
    ) 
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING id, template_id, group_id, name, description, created_at
  `;
  
  const { rows } = await pool.query(query, [templateId, groupId, templateName, description]);
  return rows[0];
}
