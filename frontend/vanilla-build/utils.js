// Utility functions

/**
 * Debug helper function to show detailed information
 */
export function showDebug(message, data) {
  const debugEl = document.getElementById('debug-overlay');
  const logEl = document.getElementById('log');
  
  if (!debugEl || !logEl) return;
  
  const timestamp = new Date().toISOString().substr(11, 12);
  const logEntry = document.createElement('div');
  
  logEntry.innerHTML = `
    <div class="debug-entry">
      <span class="debug-time">${timestamp}</span>
      <span class="debug-message">${message}</span>
      ${data ? `<pre class="debug-data">${JSON.stringify(data, null, 2)}</pre>` : ''}
    </div>
  `;
  
  logEl.prepend(logEntry);
  
  // Keep log to a reasonable size
  const entries = logEl.querySelectorAll('.debug-entry');
  if (entries.length > 50) {
    logEl.removeChild(entries[entries.length - 1]);
  }
}

/**
 * Log function to simplify debugging
 */
export function log(message, type = 'info') {
  const logContainer = document.getElementById('log-container');
  if (!logContainer) return;
  
  const timestamp = new Date().toISOString().substr(11, 12);
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-${type}`;
  
  // Format message - handle both strings and objects
  let formattedMessage = message;
  if (typeof message === 'object' && message !== null) {
    try {
      formattedMessage = JSON.stringify(message, null, 2);
    } catch (e) {
      formattedMessage = String(message);
    }
  }
  
  logEntry.innerHTML = `
    <span class="log-time">${timestamp}</span>
    <span class="log-message">${formattedMessage}</span>
  `;
  
  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
  
  // Also log to console
  if (type === 'error') {
    console.error(`[${timestamp}]`, message);
  } else if (type === 'warn') {
    console.warn(`[${timestamp}]`, message);
  } else {
    console.log(`[${timestamp}]`, message);
  }
}

/**
 * Function to inspect localStorage for tokens
 */
export function checkLocalStorage() {
  log('Checking localStorage for tokens...');
  
  // Check for JWT token
  const token = localStorage.getItem('token');
  log(`JWT token in localStorage: ${token ? 'Found' : 'Not found'}`);
  
  // Check for username
  const username = localStorage.getItem('username');
  log(`Username in localStorage: ${username || 'Not found'}`);
  
  // Check for any other auth-related items
  let authItems = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.includes('auth') || key.includes('token') || key.includes('user')) {
      log(`Auth-related item found in localStorage: ${key}`);
      authItems++;
    }
  }
  
  if (authItems === 0) {
    log('No auth-related items found in localStorage');
  }
  
  return {
    hasToken: !!token,
    username: username,
    authItemCount: authItems
  };
}
