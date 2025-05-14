// Main application initialization

// Import dependencies
import { log, showDebug } from './utils.js';
import { fetchCsrfToken, getApiBaseUrl } from './api.js';
import { checkAuthStatus, handleLogin, handleLogout } from './auth.js';
import { fetchConversations, displayConversations, setupNewConversationButton, createConversation } from './conversations.js';
import { fetchTemplates, displayTemplates, setupNewTemplateButton, createTemplate } from './templates.js';
import { fetchTopics, displayTopics, setupNewTopicButton, handleTopicSelection } from './topics.js';

// Global state
let currentGroup = null;
let currentConversation = null;
let currentTemplate = null;
let groupsLoaded = false;

// Toggle debug overlay with keyboard shortcut
document.addEventListener('keydown', function(e) {
  if (e.key === 'F2' || (e.ctrlKey && e.key === 'd')) {
    const debugEl = document.getElementById('debug-overlay');
    if (debugEl) {
      debugEl.style.display = debugEl.style.display === 'none' ? 'block' : 'none';
    }
  }
});

/**
 * Load groups from the server
 */
async function loadGroups() {
  if (groupsLoaded) {
    log('Groups already loaded, skipping duplicate load');
    return;
  }
  
  try {
    log('Loading groups...');
    const response = await fetch(`/api/groups`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const groups = await response.json();
    log(`Loaded ${groups.length} groups`);
    
    // Process groups here
    if (groups && groups.length > 0) {
      // Display groups in a dropdown or selector
      // For now, just select the first group
      selectGroup(groups[0]);
    }
    
    groupsLoaded = true;
  } catch (error) {
    console.error('Error loading groups:', error);
    log(`Error loading groups: ${error.message}`, 'error');
  }
}

/**
 * Select a group and load its conversations and templates
 */
async function selectGroup(group) {
  try {
    currentGroup = group;
    log(`Group selected: ${group.id}, name: '${group.name}'`);
    
    // Load conversations for this group
    const conversations = await fetchConversations(group.id);
    displayConversations(conversations, selectConversation);
    
    // Load templates for this group
    const templates = await fetchTemplates(group.id);
    displayTemplates(templates, selectTemplate);
    
    // Set up new conversation and template buttons
    setupNewConversationButton(group.id, handleNewConversation);
    setupNewTemplateButton(group.id, handleNewTemplate);
    
  } catch (error) {
    log(`Error selecting group: ${error.message}`, 'error');
    console.error('Group selection error:', error);
  }
}

/**
 * Handle selection of a conversation
 */
async function selectConversation(conversation) {
  try {
    // Clear any selected template
    document.querySelectorAll('#templates-list .conversation-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    currentConversation = conversation;
    currentTemplate = null;
    
    log(`Conversation selected: ${conversation.name} (ID: ${conversation.id})`);
    
    // Update conversation title
    const conversationTitle = document.getElementById('conversation-title');
    if (conversationTitle) {
      conversationTitle.textContent = conversation.name;
    }
    
    // Hide topics column for regular conversations
    const topicsColumn = document.getElementById('topics-column');
    if (topicsColumn) {
      topicsColumn.style.display = 'none';
    }
    
    // Load conversation content
    // This would be implemented based on your API
    
  } catch (error) {
    log(`Error selecting conversation: ${error.message}`, 'error');
    console.error('Conversation selection error:', error);
  }
}

/**
 * Handle selection of a template
 */
async function selectTemplate(template) {
  try {
    // Clear any selected conversation
    document.querySelectorAll('#conversations-list .conversation-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    currentTemplate = template;
    currentConversation = null;
    
    // Check if this is a template (type_id = 2)
    const isTemplate = template.type_id === 2;
    log(`Selected ${isTemplate ? 'template' : 'conversation'}: ${template.name} (ID: ${template.id}), type_id: ${template.type_id}`);
    showDebug('Template object', template);
    
    // Update conversation title
    const conversationTitle = document.getElementById('conversation-title');
    if (conversationTitle) {
      conversationTitle.textContent = template.name;
    }
    
    // Show topics column for templates
    const topicsColumn = document.getElementById('topics-column');
    if (topicsColumn) {
      if (isTemplate) {
        log('This is a template, showing topics column');
        // Make sure the topics column is visible
        topicsColumn.style.display = 'flex';
        
        try {
          // Fetch and display topics for this template
          log(`Fetching topics for template ID: ${template.id}`);
          const topics = await fetchTopics(template.id);
          log(`Fetched ${topics.length} topics for template ${template.id}`);
          showDebug('Topics data', topics);
          
          // Display the topics
          displayTopics(topics, handleTopicSelection);
          
          // Set up new topic button
          setupNewTopicButton(template.id, handleNewTopic);
        } catch (topicError) {
          log(`Error fetching topics: ${topicError.message}`, 'error');
          console.error('Topic fetching error:', topicError);
          
          // Still display the topics column even if fetching fails
          const topicsList = document.getElementById('topics-list');
          if (topicsList) {
            topicsList.innerHTML = '<div class="conversation-item">No topics yet</div>';
          }
        }
      } else {
        log('This is not a template, hiding topics column');
        // Hide the topics column
        topicsColumn.style.display = 'none';
      }
    } else {
      log('Topics column element not found in the DOM', 'error');
    }
    
  } catch (error) {
    log(`Error selecting template: ${error.message}`, 'error');
    console.error('Template selection error:', error);
  }
}

/**
 * Handle creation of a new conversation
 */
function handleNewConversation(newConversation) {
  log(`New conversation created: ${newConversation.name} (ID: ${newConversation.id})`);
  
  // Refresh conversations list
  fetchConversations(currentGroup.id).then(conversations => {
    displayConversations(conversations, selectConversation);
    
    // Select the new conversation
    const newItem = document.querySelector(`#conversations-list .conversation-item[data-conversation-id="${newConversation.id}"]`);
    if (newItem) {
      newItem.click();
    }
  });
}

/**
 * Handle creation of a new template
 */
function handleNewTemplate(newTemplate) {
  log(`New template created: ${newTemplate.name} (ID: ${newTemplate.id})`);
  
  // Refresh templates list
  fetchTemplates(currentGroup.id).then(templates => {
    displayTemplates(templates, selectTemplate);
    
    // Select the new template
    const newItem = document.querySelector(`#templates-list .conversation-item[data-template-id="${newTemplate.id}"]`);
    if (newItem) {
      newItem.click();
    }
  });
}

/**
 * Handle creation of a new topic
 */
function handleNewTopic(newTopic) {
  log(`New topic created: ${newTopic.title} (ID: ${newTopic.id})`);
  
  // Refresh topics list
  fetchTopics(currentTemplate.id).then(topics => {
    displayTopics(topics, handleTopicSelection);
    
    // Select the new topic
    const newItem = document.querySelector(`#topics-list .conversation-item[data-topic-id="${newTopic.id}"]`);
    if (newItem) {
      newItem.click();
    }
  });
}

/**
 * Initialize the message input and send button
 */
function initializeMessageInput() {
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  
  if (!userInput || !sendButton) return;
  
  // Handle send button click
  sendButton.addEventListener('click', () => {
    const message = userInput.textContent.trim();
    if (message) {
      sendMessage(message);
      userInput.textContent = '';
    }
  });
  
  // Handle Enter key press
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendButton.click();
    }
  });
}

/**
 * Send a message
 */
function sendMessage(message) {
  log(`Sending message: ${message}`);
  
  // Add user message to transcript
  addMessageToTranscript(message, 'user');
  
  // In a real app, you would send this to your API
  // For now, just simulate a response
  setTimeout(() => {
    addMessageToTranscript('This is a simulated response. The messaging functionality would be implemented based on your API.', 'ai');
  }, 1000);
}

/**
 * Add a message to the transcript
 */
function addMessageToTranscript(message, type) {
  const transcript = document.getElementById('transcript');
  if (!transcript) return;
  
  const messageEl = document.createElement('div');
  messageEl.className = `message ${type}-message`;
  messageEl.textContent = message;
  
  transcript.appendChild(messageEl);
  
  // Scroll to bottom
  transcript.scrollTop = transcript.scrollHeight;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  log('SPA initialized - checking authentication status');
  
  // Set up event listeners
  const loginForm = document.getElementById('login-form');
  const logoutButton = document.getElementById('logout-button');
  
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }
  
  // Initialize message input
  initializeMessageInput();
  
  // Check authentication status
  const isAuthenticated = await checkAuthStatus();
  
  if (isAuthenticated) {
    log('User is authenticated');
    
    // Check for login redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('source') === 'login' && localStorage.getItem('just_logged_in') === 'true') {
      log('Handling login redirect...');
      // Clear the flag and reload without query params
      localStorage.removeItem('just_logged_in');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Load groups only once
    await loadGroups();
  } else {
    log('User is not authenticated');
  }
  
  // For debugging
  window.showDebug = showDebug;
  window.log = log;
  
  log('Application initialization complete');
});
