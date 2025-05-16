/**
 * Templates module - Handles template-related functionality
 */

import { log, showDebug } from './utils.js';
import { getApiBaseUrl } from './api.js';

/**
 * Fetch templates for a specific group
 * @param {number} groupId - The group ID
 * @returns {Promise<Array>} - Array of templates
 */
export async function fetchTemplates(groupId) {
  try {
    log(`Fetching templates for group ${groupId}...`);
    
    // Use the correct endpoint format without getApiBaseUrl since we're running locally
    const response = await fetch(`/api/grpCons/by-group/${groupId}?typeId=2`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch templates. Status: ${response.status}`);
    }
    
    const templates = await response.json();
    log(`Loaded ${templates.length} templates for group ${groupId}`);
    
    return templates;
  } catch (error) {
    log(`Error fetching templates: ${error.message}`, 'error');
    console.error('Template loading error:', error);
    return [];
  }
}

/**
 * Create a new template
 * @param {number} groupId - The group ID
 * @param {string} name - Template name
 * @param {string} description - Template description
 * @returns {Promise<Object>} - The created template
 */
export async function createTemplate(groupId, name, description) {
  try {
    log(`Creating new template in group ${groupId}...`);
    
    const response = await fetch(`/api/grpCons`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        groupId,
        name,
        description,
        typeId: 2 // Template type
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create template. Status: ${response.status}`);
    }
    
    const template = await response.json();
    log(`Template created: ${template.name} (ID: ${template.id})`);
    
    return template;
  } catch (error) {
    log(`Error creating template: ${error.message}`, 'error');
    console.error('Template creation error:', error);
    throw error;
  }
}

/**
 * Display templates in the templates list
 * @param {Array} templates - Array of template objects
 * @param {Function} onSelect - Callback function when a template is selected
 */
export function displayTemplates(templates, onSelect) {
  const templatesList = document.getElementById('templates-list');
  
  // Clear existing templates
  templatesList.innerHTML = '';
  
  if (templates.length === 0) {
    const noTemplatesMsg = document.createElement('div');
    noTemplatesMsg.className = 'conversation-item';
    noTemplatesMsg.textContent = 'No templates yet';
    templatesList.appendChild(noTemplatesMsg);
    return;
  }
  
  // Add templates to the list
  templates.forEach(template => {
    const templateItem = document.createElement('div');
    templateItem.className = 'conversation-item';
    templateItem.textContent = template.name;
    templateItem.dataset.templateId = template.id;
    
    // Add click event to handle template selection
    templateItem.addEventListener('click', () => {
      // Update visual selection
      document.querySelectorAll('#templates-list .conversation-item').forEach(item => {
        item.classList.remove('selected');
      });
      templateItem.classList.add('selected');
      
      // Call the onSelect callback
      if (typeof onSelect === 'function') {
        onSelect(template);
      }
    });
    
    templatesList.appendChild(templateItem);
  });
}

/**
 * Handle new template button click
 * @param {number} groupId - The current group ID
 * @param {Function} onTemplateCreated - Callback after template is created
 */
export function setupNewTemplateButton(groupId, onTemplateCreated) {
  const newTemplateBtn = document.getElementById('new-template-btn');
  
  if (!newTemplateBtn) return;
  
  newTemplateBtn.addEventListener('click', async () => {
    const templateName = prompt('Enter template name:');
    if (!templateName) return;
    
    const templateDescription = prompt('Enter template description (optional):');
    
    try {
      const newTemplate = await createTemplate(groupId, templateName, templateDescription || '');
      
      if (typeof onTemplateCreated === 'function') {
        onTemplateCreated(newTemplate);
      }
    } catch (error) {
      alert(`Failed to create template: ${error.message}`);
    }
  });
}
