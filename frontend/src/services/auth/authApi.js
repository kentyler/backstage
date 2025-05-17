/**
 * Authentication API service
 * Handles all authentication-related API calls
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || window.location.origin;



/**
 * Send login request to the server and initialize LLM service
 * @param {string} email User's email
 * @param {string} password User's password
 * @returns {Promise<Object>} Response data including token and user info
 */
export const loginUser = async (email, password) => {
  console.log('Attempting login with:', { email });
  
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ username: email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  const data = await response.json();
  console.log('Login response:', data);
  
  return {
    success: true,
    user: { 
      id: data.user.id,
      email: email,
      username: email
    }
  };
};

/**
 * Send logout request to the server
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  const response = await fetch(`${API_BASE_URL}/api/logout`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }

  // Clear fallback token
  localStorage.removeItem('auth_token');
};

/**
 * Check current authentication status
 * @returns {Promise<Object>} User authentication status and data
 */
export const checkAuthStatus = async () => {
  try {
    console.log('Checking auth status...');
    const response = await fetch(`${API_BASE_URL}/api/auth-status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      console.log('Auth status check failed:', response.status);
      return { authenticated: false };
    }

    const data = await response.json();
    console.log('Auth status response:', data);
    
    return {
      authenticated: data.authenticated,
      user: data.user
    };
  } catch (error) {
    console.error('Auth check error:', error);
    return { authenticated: false };
  }
};
