// Form handling for authentication
import { log } from '../utils.js';
import { loginUser, logoutUser } from './authApi.js';
import { setAuthToken, clearAuthState } from './authState.js';
import { setCurrentUsername, clearUserSession } from './userSession.js';
import { redirectToLogin } from './authNavigation.js';

/**
 * Handle login form submission
 * @param {Event} event Form submission event
 */
export async function handleLoginSubmission(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorElement = document.getElementById('error');
  const loadingIndicator = document.getElementById('loading-indicator');
  
  if (!email || !password) {
    errorElement.textContent = 'Email and password are required';
    return;
  }
  
  try {
    loadingIndicator.style.display = 'block';
    errorElement.textContent = '';
    
    const { ok, data } = await loginUser(email, password);
    
    if (ok) {
      log('Login successful');
      
      if (data.token) {
        setAuthToken(data.token);
      }
      
      if (data.name) {
        setCurrentUsername(data.name);
      }
      
      window.location.href = '/index.html?firstLogin=true';
    } else {
      errorElement.textContent = data.error || 'Login failed';
      log('Login failed:', data.error);
    }
  } catch (error) {
    errorElement.textContent = 'An error occurred during login';
    log('Login error:', error);
    console.error('Login error:', error);
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

/**
 * Handle logout action
 */
export async function handleLogoutAction() {
  try {
    const { ok, statusText } = await logoutUser();
    
    if (ok) {
      log('Logout successful');
      clearAuthState();
      clearUserSession();
      redirectToLogin();
    } else {
      log('Logout failed:', statusText);
      console.error('Logout failed:', statusText);
    }
  } catch (error) {
    log('Logout error:', error);
    console.error('Logout error:', error);
  }
}
