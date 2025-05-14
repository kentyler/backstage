// Authentication related functions

/**
 * Update UI based on authentication state
 */
export function updateUIForAuthState() {
  const token = localStorage.getItem('token');
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
  const token = localStorage.getItem('token');
  
  if (!token) {
    log('No token found in localStorage');
    updateUIForAuthState();
    return false;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      credentials: 'include' // Important for cookies
    });

    if (response.ok) {
      const data = await response.json();
      log('Auth status check successful', data);
      
      // Store username if available
      if (data.username) {
        localStorage.setItem('username', data.username);
      }
      
      updateUIForAuthState();
      return true;
    } else {
      // If we get a 401, clear the invalid token
      if (response.status === 401) {
        log('Token invalid or expired, clearing from localStorage');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
      }
      updateUIForAuthState();
      return false;
    }
  } catch (error) {
    log('Error checking auth status:', 'error');
    console.error('Auth check error:', error);
    updateUIForAuthState();
    return false;
  }
}

/**
 * Handle login form submission
 */
export async function handleLogin(event) {
  if (event) event.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const loginButton = document.getElementById('login-button');
  const loginError = document.getElementById('login-error');
  
  if (!username || !password) {
    if (loginError) loginError.textContent = 'Please enter both username and password';
    return;
  }
  
  // Disable login button and show loading state
  if (loginButton) {
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';
  }
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': await fetchCsrfToken()
      },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Store the token in localStorage as a fallback
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', username);
        log('Login successful, token stored in localStorage');
      }
      
      // Set login success flag
      localStorage.setItem('just_logged_in', 'true');
      
      // Update UI and redirect
      updateUIForAuthState();
      
      // Redirect to the root with source=login parameter
      window.location.href = window.location.pathname + '?source=login';
      
    } else {
      // Handle login error
      const errorMessage = data.message || 'Login failed. Please check your credentials.';
      if (loginError) loginError.textContent = errorMessage;
      log(`Login failed: ${errorMessage}`, 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    if (loginError) loginError.textContent = 'An error occurred during login';
    log('Login error: ' + error.message, 'error');
  } finally {
    // Re-enable login button
    if (loginButton) {
      loginButton.disabled = false;
      loginButton.textContent = 'Login';
    }
  }
}

/**
 * Handle logout
 */
export async function handleLogout() {
  const token = localStorage.getItem('token');
  
  try {
    // Try to call the server-side logout endpoint
    await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-CSRF-Token': await fetchCsrfToken()
      },
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Continue with client-side cleanup even if server logout fails
  } finally {
    // Clear client-side authentication state
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    
    // Update UI
    updateUIForAuthState();
    
    // Redirect to login page
    window.location.href = window.location.pathname;
  }
}

// Import dependencies
import { log } from './utils.js';
import { fetchCsrfToken, getApiBaseUrl } from './api.js';
