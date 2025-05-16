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
  try {
    log(`New conversation created: ${newConversation.name} (ID: ${newConversation.id})`);
    
    // Update the conversations list
    const conversationsList = document.getElementById('conversations-list');
    if (conversationsList) {
      const conversationItem = document.createElement('div');
      conversationItem.className = 'conversation-item';
      conversationItem.textContent = newConversation.name;
      conversationItem.dataset.id = newConversation.id;
      conversationItem.addEventListener('click', () => selectConversation(newConversation));
      
      conversationsList.appendChild(conversationItem);
      
      // Select the new conversation
      selectConversation(newConversation);
    }
  } catch (error) {
    log(`Error handling new conversation: ${error.message}`, 'error');
    console.error('New conversation error:', error);
  }
}

/**
 * Handle creation of a new template
 */
function handleNewTemplate(newTemplate) {
  try {
    log(`New template created: ${newTemplate.name} (ID: ${newTemplate.id})`);
    
    // Update the templates list
    const templatesList = document.getElementById('templates-list');
    if (templatesList) {
      const templateItem = document.createElement('div');
      templateItem.className = 'conversation-item';
      templateItem.textContent = newTemplate.name;
      templateItem.dataset.id = newTemplate.id;
      templateItem.addEventListener('click', () => selectTemplate(newTemplate));
      
      templatesList.appendChild(templateItem);
      
      // Select the new template
      selectTemplate(newTemplate);
    }
  } catch (error) {
    log(`Error handling new template: ${error.message}`, 'error');
    console.error('New template error:', error);
  }
}

/**
 * Handle creation of a new topic
 */
function handleNewTopic(newTopic) {
  try {
    log(`New topic created: ${newTopic.title} (ID: ${newTopic.id})`);
    
    // Update the topics list
    const topicsList = document.getElementById('topics-list');
    if (topicsList) {
      const topicItem = document.createElement('div');
      topicItem.className = 'topic-item';
      topicItem.textContent = newTopic.title;
      topicItem.dataset.id = newTopic.id;
      topicItem.addEventListener('click', () => handleTopicSelection(newTopic));
      
      topicsList.appendChild(topicItem);
      
      // Select the new topic
      handleTopicSelection(newTopic);
    }
  } catch (error) {
    log(`Error handling new topic: ${error.message}`, 'error');
    console.error('New topic error:', error);
  }
}

/**
 * Initialize message input and send button
 */
function initializeMessageInput() {
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  
  if (userInput && sendButton) {
    // Handle user input placeholder
    userInput.addEventListener('focus', () => {
      if (userInput.textContent === '') {
        userInput.setAttribute('data-placeholder-active', 'false');
      }
    });
    
    userInput.addEventListener('blur', () => {
      if (userInput.textContent === '') {
        userInput.setAttribute('data-placeholder-active', 'true');
      }
    });
    
    // Handle send button click
    sendButton.addEventListener('click', () => {
      const message = userInput.textContent.trim();
      if (message) {
        sendMessage(message);
        userInput.textContent = '';
      }
    });
  }
}

/**
 * Send a message
 */
async function sendMessage(message) {
  try {
    log(`Sending message: "${message}"`);
    
    // Add user message to transcript
    addMessageToTranscript(message, 'user');
    
    // Here you would send the message to your API
    // and handle the response
    
    // For now, simulate a response
    setTimeout(() => {
      addMessageToTranscript('This is a simulated response.', 'agent');
    }, 1000);
  } catch (error) {
    log(`Error sending message: ${error.message}`, 'error');
  }
}

/**
 * Add a message to the transcript
 */
function addMessageToTranscript(message, type) {
  const transcript = document.getElementById('transcript');
  if (transcript) {
    const messageContainer = document.createElement('div');
    messageContainer.className = `message ${type}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = message;
    
    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.textContent = new Date().toLocaleTimeString();
    
    messageContainer.appendChild(bubble);
    messageContainer.appendChild(meta);
    transcript.appendChild(messageContainer);
    
    // Scroll to bottom
    transcript.scrollTop = transcript.scrollHeight;
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  log('SPA initialized - checking authentication status');
  
  try {
    // Check if there's a first-time login parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const isFirstTimeLogin = urlParams.get('login') === 'true' || sessionStorage.getItem('first_time_login') === 'true';
    
    if (isFirstTimeLogin) {
      log('Detected first-time login. Will reload page once to complete auth flow.');
      
      // Clear the marker in sessionStorage so we don't enter an infinite loop
      sessionStorage.removeItem('first_time_login');
      
      // Remove login parameter from URL and reload page
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Force a reload to ensure auth state is properly loaded
      window.location.reload(true);
      return;
    }
  
    // Check authentication status
    const isAuthenticated = await checkAuthStatus();
    showDebug('Authentication status', { isAuthenticated });
    
    if (isAuthenticated) {
      log('User is authenticated, showing main content');
      
      // Show main content and hide login form
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('main-content').style.display = 'block';
      document.getElementById('main-nav').style.display = 'block';
      
      // Set up logout button
      document.getElementById('logout-button').addEventListener('click', handleLogout);
      
      // Initialize the input area
      initializeMessageInput();
      
      // Load content
      loadGroups();
    } else {
      log('User is not authenticated, showing login form');
      
      // Show login form and hide main content
      document.getElementById('login-section').style.display = 'block';
      document.getElementById('main-content').style.display = 'none';
      document.getElementById('main-nav').style.display = 'none';
      
      // Set up login form behavior
      document.getElementById('login-form').addEventListener('submit', handleLogin);
    }
  } catch (error) {
    console.error('Application initialization error:', error);
    log(`Error during initialization: ${error.message}`, 'error');
  }
});
