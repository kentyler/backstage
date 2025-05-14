// Authentication related functions

// Import dependencies
import { log } from './utils.js';
import { fetchCsrfToken, getApiBaseUrl } from './api.js';

/**
 * Update UI based on authentication state
 */
export function updateUIForAuthState() {
  const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
  const nav = document.getElementById('main-nav');
  const loginSection = document.getElementById('login-section');
  const content = document.getElementById('content');
  const userInfo = document.getElementById('user-info');
  const username = localStorage.getItem('username') || 'User';

  if (token) {
    // User is logged in
    if (nav) nav.style.display = 'block';
    if (loginSection) loginSection.style.display = 'none';
    if (content) content.style.display = 'block';
    if (userInfo) userInfo.textContent = `Welcome, ${username}`;
    
    // Check for first-time login
    const firstTimeLogin = new URLSearchParams(window.location.search).get('firstLogin');
    if (firstTimeLogin === 'true') {
      log('First time login detected, reloading page...');
      // Remove the parameter and reload
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      window.location.reload();
    }
  } else {
    // User is not logged in
    if (nav) nav.style.display = 'none';
    if (loginSection) loginSection.style.display = 'block';
    if (content) content.style.display = 'none';
  }
}

/**
 * Check authentication status using JWT token
 */
export async function checkAuthStatus() {
  // Check both possible token locations (for dual authentication system)
  const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
  const isAuthenticated = localStorage.getItem('is_authenticated') === 'true';
  
  if (!token && !isAuthenticated) {
    log('No authentication token found in localStorage');
    return false;
  }

  try {
    // Use Authorization header if token is available
    const headers = {
      'Accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${getApiBaseUrl()}/api/participants/status`, {
      method: 'GET',
      headers: headers,
      credentials: 'include' // Important for cookies
    });

    if (response.ok) {
      const data = await response.json();
      log('Auth status check successful', data);
      
      // Store username if available
      if (data.name) {
        localStorage.setItem('username', data.name);
        
        // Update user name in the UI
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
          userNameElement.textContent = data.name;
        }
      }
      
      return true;
    } else {
      // If we get a 401, clear the invalid tokens
      if (response.status === 401) {
        log('Token invalid or expired, clearing from localStorage');
        localStorage.removeItem('token');
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('is_authenticated');
        localStorage.removeItem('username');
      }
      return false;
    }
  } catch (error) {
    log('Error checking auth status:', 'error');
    console.error('Auth check error:', error);
    return false;
  }
}

/**
 * Handle login form submission
 */
export async function handleLogin(event) {
  if (event) event.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const loginButton = document.getElementById('login-button');
  const loginError = document.getElementById('login-error');
  const loadingIndicator = document.getElementById('loading-indicator');
  
  if (!email || !password) {
    if (loginError) loginError.textContent = 'Please enter both email and password';
    return;
  }
  
  // Disable login button and show loading state
  if (loginButton) {
    loginButton.disabled = true;
  }
  
  if (loadingIndicator) {
    loadingIndicator.style.display = 'block';
  }
  
  try {
    // Redirect to the separate login page which handles the authentication flow
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Login error:', error);
    if (loginError) loginError.textContent = 'An error occurred during login';
    log('Login error: ' + error.message, 'error');
    
    // Re-enable login button and hide loading indicator
    if (loginButton) {
      loginButton.disabled = false;
    }
    
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  }
}

/**
 * Handle logout
 */
export async function handleLogout() {
  // Get token from both possible locations
  const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
  
  try {
    // Set up headers with the token if available
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Try to call the server-side logout endpoint
    await fetch(`${getApiBaseUrl()}/api/participants/logout`, {
      method: 'POST',
      headers: headers,
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Continue with client-side cleanup even if server logout fails
  } finally {
    // Clear client-side authentication state
    localStorage.removeItem('token');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('is_authenticated');
    localStorage.removeItem('username');
    localStorage.removeItem('login_timestamp');
    sessionStorage.removeItem('first_time_login');
    
    // Redirect to login page
    window.location.href = '/login.html';
  }
}
