// Main application initialization

// Import dependencies
import { log, showDebug } from './utils.js';
import { checkAuthStatus, handleLogin, handleLogout } from './auth.js';

// Global flag to prevent duplicate group loading
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
    const response = await fetch('/api/groups', {
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
      // Select the first group for demonstration
      const selectedGroup = groups[0];
      log(`Group selected: ${selectedGroup.id}, name: '${selectedGroup.name}'`);
      
      // Attempt to load templates for this group
      await loadTemplatesForGroup(selectedGroup.id);
    }
    
    groupsLoaded = true;
  } catch (error) {
    console.error('Error loading groups:', error);
    log(`Error loading groups: ${error.message}`, 'error');
  }
}

/**
 * Load templates for a specific group
 */
async function loadTemplatesForGroup(groupId) {
  try {
    log(`Fetching templates for group ${groupId}...`);
    
    // Use the correct capitalization for the endpoint
    const response = await fetch(`/api/grpCons/by-group/${groupId}?typeId=2`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch templates for group ${groupId}. Status: ${response.status}`);
    }
    
    const templates = await response.json();
    log(`Templates loaded successfully: ${templates.length} templates found`);
    return templates;
  } catch (error) {
    log(`Error loading templates: ${error.message}`, 'error');
    console.error('Template loading error:', error);
    return [];
  }
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
