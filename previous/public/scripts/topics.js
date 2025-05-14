/**
 * Topics module - Handles template topics functionality
 */

import { log, showDebug } from './utils.js';
import { getApiBaseUrl } from './api.js';

/**
 * Fetch topics for a specific template
 * @param {number} templateId - The template ID
 * @returns {Promise<Array>} - Array of topics
 */
export async function fetchTopics(templateId) {
  try {
    // Ensure templateId is a number
    const id = typeof templateId === 'string' ? parseInt(templateId, 10) : templateId;
    
    log(`Fetching topics for template ${id}...`);
    
    const url = `/api/grp-con-template-topics/by-template/${id}`;
    log(`Fetching topics from: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch topics. Status: ${response.status}`);
    }
    
    const topics = await response.json();
    log(`Fetched ${topics.length} topics for template ${id}:`, topics);
    showDebug('Topics data', topics);
    
    // Sort topics by topic_index
    topics.sort((a, b) => parseFloat(a.topic_index) - parseFloat(b.topic_index));
    
    return topics;
  } catch (error) {
    log(`Error fetching topics: ${error.message}`, 'error');
    console.error('Error fetching topics:', error);
    return [];
  }
}

/**
 * Create a new topic
 * @param {number} templateId - The template ID
 * @param {string} title - Topic title
 * @param {string} content - Topic content
 * @param {number} topicIndex - Topic index for ordering
 * @returns {Promise<Object>} - The created topic
 */
export async function createTopic(templateId, title, content, topicIndex) {
  try {
    log(`Creating new topic for template ${templateId}...`);
    
    const response = await fetch(`/api/grp-con-template-topics`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        template_id: templateId,
        title,
        content,
        topic_index: topicIndex
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create topic. Status: ${response.status}`);
    }
    
    const topic = await response.json();
    log(`Topic created: ${topic.title} (ID: ${topic.id})`);
    
    return topic;
  } catch (error) {
    log(`Error creating topic: ${error.message}`, 'error');
    console.error('Topic creation error:', error);
    throw error;
  }
}

/**
 * Display topics in the topics list
 * @param {Array} topics - Array of topic objects
 * @param {Function} onSelect - Callback function when a topic is selected
 */
export function displayTopics(topics, onSelect) {
  const topicsList = document.getElementById('topics-list');
  
  if (!topicsList) {
    log('Topics list element not found in the DOM', 'error');
    return;
  }
  
  // Clear existing topics
  topicsList.innerHTML = '';
  log(`Displaying ${topics.length} topics in the topics list`);
  showDebug('Topics to display', topics);
  
  if (!topics || topics.length === 0) {
    log('No topics to display');
    const noTopicsMsg = document.createElement('div');
    noTopicsMsg.className = 'conversation-item';
    noTopicsMsg.textContent = 'No topics yet';
    topicsList.appendChild(noTopicsMsg);
    return;
  }
  
  // Add topics to the list
  topics.forEach(topic => {
    log(`Adding topic to list: ${topic.title} (ID: ${topic.id})`);
    const topicItem = document.createElement('div');
    topicItem.className = 'conversation-item';
    topicItem.textContent = topic.title;
    topicItem.dataset.topicId = topic.id;
    
    // Add click event to handle topic selection
    topicItem.addEventListener('click', () => {
      log(`Topic selected: ${topic.title} (ID: ${topic.id})`);
      
      // Update visual selection
      document.querySelectorAll('#topics-list .conversation-item').forEach(item => {
        item.classList.remove('selected');
      });
      topicItem.classList.add('selected');
      
      // Call the onSelect callback
      if (typeof onSelect === 'function') {
        onSelect(topic);
      }
    });
    
    topicsList.appendChild(topicItem);
  });
  
  log('Topics displayed successfully');
}

/**
 * Handle new topic button click
 * @param {number} templateId - The current template ID
 * @param {Function} onTopicCreated - Callback after topic is created
 */
export function setupNewTopicButton(templateId, onTopicCreated) {
  const newTopicBtn = document.getElementById('new-topic-btn');
  
  if (!newTopicBtn) return;
  
  newTopicBtn.addEventListener('click', async () => {
    const topicTitle = prompt('Enter topic title:');
    if (!topicTitle) return;
    
    const topicContent = prompt('Enter topic content:');
    if (!topicContent) return;
    
    try {
      // Get the current highest index and add 1
      const topics = await fetchTopics(templateId);
      const highestIndex = topics.length > 0 
        ? Math.max(...topics.map(t => parseFloat(t.topic_index || 0))) 
        : -1;
      const newIndex = highestIndex + 1;
      
      const newTopic = await createTopic(templateId, topicTitle, topicContent, newIndex);
      
      if (typeof onTopicCreated === 'function') {
        onTopicCreated(newTopic);
      }
    } catch (error) {
      alert(`Failed to create topic: ${error.message}`);
    }
  });
}

/**
 * Handle topic selection
 * @param {Object} topic - The selected topic
 */
export function handleTopicSelection(topic) {
  log(`Selected topic: ${topic.title} (ID: ${topic.id})`);
  
  // Create a prompt in the form of "Tell me about <topic>"
  const prompt = `Tell me about ${topic.title}`;
  
  // Set the prompt in the user input field
  const userInput = document.getElementById('user-input');
  if (userInput) {
    userInput.textContent = prompt;
  }
}
