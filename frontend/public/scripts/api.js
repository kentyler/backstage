// API interaction utilities

// Import dependencies
import { log } from './utils.js';

let csrfToken = null;

/**
 * Fetch CSRF token for API requests
 */
export async function fetchCsrfToken() {
  // Return cached token if available
  if (csrfToken) {
    return csrfToken;
  }
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/csrf-token`, {
      method: 'GET',
      credentials: 'include' // Important for cookies
    });
    
    if (response.ok) {
      const data = await response.json();
      csrfToken = data.csrfToken;
      log('CSRF token fetched successfully');
      return csrfToken;
    } else {
      throw new Error('Failed to fetch CSRF token');
    }
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    log('Error fetching CSRF token: ' + error.message, 'error');
    throw error;
  }
}

/**
 * Helper function to get API base URL (copied from login.html)
 */
export function getApiBaseUrl() {
  // If we're running in a browser, use the current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for non-browser environments (shouldn't happen in client-side code)
  return '';
}

/**
 * Function to test CSRF token
 */
export async function testCsrfToken() {
  try {
    const token = await fetchCsrfToken();
    log('Testing CSRF token...');
    
    const response = await fetch(`${getApiBaseUrl()}/api/test-csrf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token
      },
      credentials: 'include',
      body: JSON.stringify({ test: 'CSRF test' })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log('CSRF test successful', data);
      return true;
    } else {
      log(`CSRF test failed: ${data.message || 'Unknown error'}`, 'error');
      return false;
    }
  } catch (error) {
    log('CSRF test error: ' + error.message, 'error');
    return false;
  }
}

/**
 * Function to test authentication
 */
export async function testAuthentication() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    log('No token found for authentication test', 'warn');
    return false;
  }
  
  try {
    log('Testing authentication with token...');
    
    const response = await fetch(`${getApiBaseUrl()}/api/auth/test`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log('Authentication test successful', data);
      return true;
    } else {
      log(`Authentication test failed: ${data.message || 'Unknown error'}`, 'error');
      
      // If we get a 401, clear the invalid token
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        log('Invalid token cleared from localStorage');
      }
      
      return false;
    }
  } catch (error) {
    log('Authentication test error: ' + error.message, 'error');
    return false;
  }
}
