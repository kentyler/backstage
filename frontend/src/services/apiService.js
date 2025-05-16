import axios from 'axios';

// Get the base URL for API calls
const getApiBaseUrl = () => {
  // In production, use relative URL
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }
  // In development, use the full URL
  return 'http://localhost:5000/api';
};

// Create an axios instance with default settings
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important for cookies/sessions
});

// Log request/response for debugging the auth/proxy loop
api.interceptors.request.use(config => {
  console.log(`Request: ${config.method.toUpperCase()} ${config.url}`, config);
  return config;
}, error => {
  console.error('Request error:', error);
  return Promise.reject(error);
});

api.interceptors.response.use(response => {
  console.log(`Response: ${response.status} for ${response.config.url}`, response);
  return response;
}, error => {
  console.error('Response error:', error);
  
  // Handle specific auth errors here if needed
  if (error.response && error.response.status === 401) {
    console.warn('Authentication error detected');
    // We could redirect to login or other handling if needed
  }
  
  return Promise.reject(error);
});

export const apiService = {
  // Authentication
  login: async (username, password) => {
    try {
      const response = await api.post('/login', { username, password });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const response = await api.post('/logout');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  
  getAuthStatus: async () => {
    try {
      const response = await api.get('/auth-status');
      return response.data;
    } catch (error) {
      console.error('Auth status error:', error);
      throw error;
    }
  },
  
  // Resources
  getGroups: async () => {
    try {
      const response = await api.get('/groups');
      return response.data;
    } catch (error) {
      console.error('Get groups error:', error);
      throw error;
    }
  },
  
  // Get conversations for a specific group
  getConversations: async (groupId = null) => {
    try {
      // If groupId is provided, use it as a query parameter
      const url = groupId ? `/conversations?group_id=${groupId}` : '/conversations';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Get conversations error:', error);
      throw error;
    }
  },

  // Database tests
  testDbConnection: async () => {
    try {
      const response = await api.get('/db-test');
      return response.data;
    } catch (error) {
      console.error('Database connection test error:', error);
      throw error;
    }
  },

  getDbTables: async () => {
    try {
      const response = await api.get('/db-tables');
      return response.data;
    } catch (error) {
      console.error('Get database tables error:', error);
      throw error;
    }
  },

  executeDbQuery: async (query) => {
    try {
      const response = await api.post('/db-query', { query });
      return response.data;
    } catch (error) {
      console.error('Execute query error:', error);
      throw error;
    }
  }
};

// Export the axios instance in case we need direct access
export { api };
