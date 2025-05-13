import React, { useState, useEffect } from 'react';
import './App.css';

// Helper function to generate test conversations based on group ID
const getTestConversationsForGroup = (groupId) => {
  const now = new Date().toISOString();
  
  // Create different conversations for each group ID
  switch(parseInt(groupId)) {
    case 1: // Development Team
      return [
        { id: 101, name: 'Sprint Planning', updatedAt: now },
        { id: 102, name: 'Code Review', updatedAt: now },
        { id: 103, name: 'Bug Triage', updatedAt: now },
        { id: 104, name: 'Architecture Discussion', updatedAt: now }
      ];
    case 2: // Marketing
      return [
        { id: 201, name: 'Campaign Strategy', updatedAt: now },
        { id: 202, name: 'Content Calendar', updatedAt: now },
        { id: 203, name: 'Social Media Planning', updatedAt: now }
      ];
    case 3: // Executive Leadership
      return [
        { id: 301, name: 'Quarterly Planning', updatedAt: now },
        { id: 302, name: 'Budget Review', updatedAt: now },
        { id: 303, name: 'Strategic Initiatives', updatedAt: now },
        { id: 304, name: 'Investor Relations', updatedAt: now },
        { id: 305, name: 'Board Meeting Prep', updatedAt: now }
      ];
    default:
      // For any other group ID, create a generic set with the ID in the name
      return [
        { id: groupId * 1000 + 1, name: `Planning for Group ${groupId}`, updatedAt: now },
        { id: groupId * 1000 + 2, name: `Discussion for Group ${groupId}`, updatedAt: now },
        { id: groupId * 1000 + 3, name: `Notes for Group ${groupId}`, updatedAt: now }
      ];
  }
};

function App() {
  // Application state
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [notification, setNotification] = useState('');
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  // State for login form and authenticated user
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true); // Added to show loading state on initial auth check

  // Handle login form submission - now using real API
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      console.log('Attempting login with backend API for:', email);
      
      // Send login request to your actual backend
      const response = await fetch('/api/participants/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // This is critical - it tells fetch to include cookies in the request
        // and store cookies from the response
        credentials: 'include', 
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      });
      
      // Log response status for debugging
      console.log('Login response status:', response.status);
      
      // Check if login was successful
      if (response.ok) {
        // Parse the response data
        const data = await response.json();
        console.log('Login successful!', data);
        
        // Update authentication state
        setIsAuthenticated(true);
        
        // Set user data either from response or fetch user profile
        if (data.participant) {
          setUser(data.participant);
        } else {
          // If participant data isn't in the login response,
          // we'll get it from the check auth function
          await checkAuthStatus();
        }
        
        // Clear form
        setEmail('');
        setPassword('');
      } else {
        // Handle error response
        const errorData = await response.text();
        console.error('Login failed:', errorData);
        
        try {
          // Try to parse as JSON
          const errorJson = JSON.parse(errorData);
          setError(errorJson.error || 'Login failed. Please check your credentials.');
        } catch (e) {
          // If not JSON, use text
          setError('Login failed. Server returned: ' + 
            (response.status === 401 ? 'Invalid credentials' : 
             'Server error (' + response.status + ')'));
        }
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to check if user is authenticated
  const checkAuthStatus = async () => {
    try {
      setCheckingAuth(true);
      // Call your /api/me endpoint that's protected by authentication
      const response = await fetch('/api/me', {
        method: 'GET',
        credentials: 'include', // This is critical - it tells fetch to include cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // If request succeeds, user is authenticated
        const userData = await response.json();
        setIsAuthenticated(true);
        setUser(userData);
        console.log('User is authenticated:', userData);
      } else {
        // If request fails, user is not authenticated
        setIsAuthenticated(false);
        setUser(null);
        console.log('User is not authenticated');
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setCheckingAuth(false);
    }
  };

  // Handle logout - actually calls the logout endpoint
  const handleLogout = async () => {
    try {
      setLoading(true);
      // Call your logout endpoint to clear the server-side cookie
      const response = await fetch('/api/participants/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Successfully logged out
        setIsAuthenticated(false);
        setUser(null);
        console.log('Successfully logged out');
      } else {
        console.error('Logout failed with status:', response.status);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch groups the user belongs to
  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      console.log('Fetching groups...');
      
      const response = await fetch('/api/groups', {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const groupsData = await response.json();
        console.log('Groups fetched successfully:', groupsData);
        setGroups(groupsData);
      } else {
        console.error('Failed to fetch groups. Status:', response.status);
        // For testing purposes, add some example groups
        setGroups([
          { id: 1, name: 'Development Team' },
          { id: 2, name: 'Marketing' },
          { id: 3, name: 'Executive Leadership' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      // For testing purposes, add some example groups
      setGroups([
        { id: 1, name: 'Development Team' },
        { id: 2, name: 'Marketing' },
        { id: 3, name: 'Executive Leadership' }
      ]);
    } finally {
      setLoadingGroups(false);
    }
  };
  
  // Function to fetch templates for a group
  const fetchTemplates = async (groupId) => {
    try {
      setLoadingTemplates(true);
      console.log(`Fetching templates for group ${groupId}...`);
      
      // Get the token from localStorage as a fallback (dual authentication approach)
      const token = localStorage.getItem('jwt_token');
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Include Authorization header if token exists (fallback auth method)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/grp-cons/by-group/${groupId}?typeId=2`, {
        method: 'GET',
        credentials: 'include', // Include cookies for primary auth method
        headers: headers
      });
      
      if (response.ok) {
        const templatesData = await response.json();
        console.log('Templates fetched successfully:', templatesData);
        setTemplates(templatesData);
      } else {
        console.error(`Failed to fetch templates for group ${groupId}. Status:`, response.status);
        // For testing purposes, generate unique templates based on the group ID
        setTemplates([
          { id: 1000 + parseInt(groupId), name: `Planning Template`, type_id: 2, updatedAt: new Date().toISOString() },
          { id: 2000 + parseInt(groupId), name: `Meeting Notes Template`, type_id: 2, updatedAt: new Date().toISOString() },
          { id: 3000 + parseInt(groupId), name: `Design Document Template`, type_id: 2, updatedAt: new Date().toISOString() }
        ]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      // For testing purposes, generate unique templates based on the group ID
      setTemplates([
        { id: 1000 + parseInt(groupId), name: `Planning Template`, type_id: 2, updatedAt: new Date().toISOString() },
        { id: 2000 + parseInt(groupId), name: `Meeting Notes Template`, type_id: 2, updatedAt: new Date().toISOString() },
        { id: 3000 + parseInt(groupId), name: `Design Document Template`, type_id: 2, updatedAt: new Date().toISOString() }
      ]);
    } finally {
      setLoadingTemplates(false);
    }
  };
  
  // Function to fetch conversations for a group
  const fetchConversations = async (groupId) => {
    try {
      setLoadingConversations(true);
      console.log(`Fetching conversations for group ${groupId}...`);
      
      // Get the token from localStorage as a fallback (dual authentication approach)
      const token = localStorage.getItem('jwt_token');
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Include Authorization header if token exists (fallback auth method)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/grp-cons/by-group/${groupId}?typeId=1`, {
        method: 'GET',
        credentials: 'include', // Include cookies for primary auth method
        headers: headers
      });
      
      if (response.ok) {
        const conversationsData = await response.json();
        console.log('Conversations fetched successfully:', conversationsData);
        setConversations(conversationsData);
      } else {
        console.error(`Failed to fetch conversations for group ${groupId}. Status:`, response.status);
        // For testing purposes, generate unique conversations based on the group ID
        // This simulates what we'd get from grp_cons table in the database
        const testConversations = getTestConversationsForGroup(groupId);
        setConversations(testConversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // For testing purposes, generate unique conversations based on the group ID
      const testConversations = getTestConversationsForGroup(groupId);
      setConversations(testConversations);
    } finally {
      setLoadingConversations(false);
    }
  };
  
  // Function to handle conversation selection
  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setSelectedTemplate(null); // Deselect any template when conversation is selected
    setNotification(`Conversation selected: ${conversation.name}`);
    console.log('Conversation selected:', conversation);
    
    // Clear notification after 3 seconds
    setTimeout(() => {
      setNotification('');
    }, 3000);
  };
  
  // Function to handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setSelectedConversation(null); // Deselect any conversation when template is selected
    setNotification(`Template selected: ${template.name}`);
    console.log('Template selected:', template);
    
    // Clear notification after 3 seconds
    setTimeout(() => {
      setNotification('');
    }, 3000);
  };
  
  // Function to handle group selection
  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setNotification(`Group selected: ${group.name}`);
    console.log('Group selected:', group);
    
    // Fetch both conversations and templates for this group
    fetchConversations(group.id);
    fetchTemplates(group.id);
    
    // Reset selected items
    setSelectedConversation(null);
    setSelectedTemplate(null);
    
    // Clear notification after 3 seconds
    setTimeout(() => {
      setNotification('');
    }, 3000);
  };

  // Check authentication status when component mounts
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  // Fetch groups when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchGroups();
    }
  }, [isAuthenticated, user]);

  return (
    <div className="App">
      {/* Show loading spinner while checking initial auth state */}
      {checkingAuth ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Checking authentication status...</p>
        </div>
      ) : !isAuthenticated ? (
        // Login form - shown when not authenticated
        <div className="login-container">
          <h1>Conversational AI</h1>
          <h2>Login</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <button 
              type="submit" 
              className={`login-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        </div>
      ) : (
        // Main Application - shown when authenticated
        <div className="main-app">
          {/* Header */}
          <header>
            <div className="app-title">Conversational AI</div>
            {notification && (
              <div className="notification-message">
                {notification}
              </div>
            )}
            <div className="header-controls">
              {/* Group Dropdown */}
              <div className="group-dropdown">
                <button className="dropdown-button">
                  {loadingGroups ? 'Loading groups...' : (selectedGroup ? selectedGroup.name : 'Select Group')}
                </button>
                <div className="dropdown-content">
                  {groups.length > 0 ? (
                    groups.map(group => (
                      <div 
                        key={group.id} 
                        className="group-item dropdown-item"
                        onClick={() => handleGroupSelect(group)}
                      >
                        {group.name}
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item">No groups available</div>
                  )}
                </div>
              </div>
              
              {/* User Dropdown */}
              <div className="user-dropdown">
                <button className="dropdown-button">
                  {user?.name || 'User'}
                </button>
                <div className="dropdown-content">
                  <div className="user-info dropdown-item">
                    {user && (
                      <>
                        <div>ID: {user.id}</div>
                        <div>Email: {user.email}</div>
                      </>
                    )}
                  </div>
                  <div 
                    className="dropdown-item logout-option"
                    onClick={handleLogout}
                  >
                    Logout
                  </div>
                </div>
              </div>
            </div>
          </header>
          
          {/* Main Three-Column Layout */}
          <div className="app-container">
            {/* Left Column - Conversations and Topics */}
            <div className="conversations-column">
              {/* Conversations section */}
              <div className="conversations-header">
                <div className="conversations-title">
                  {selectedGroup ? `${selectedGroup.name} Conversations` : 'Conversations'}
                </div>
              </div>
              <div className="conversations-list">
                {loadingConversations ? (
                  <div className="loading-message">Loading conversations...</div>
                ) : conversations.length > 0 ? (
                  conversations.map(conversation => (
                    <div 
                      key={conversation.id}
                      className={`conversation-item ${selectedConversation?.id === conversation.id ? 'selected' : ''}`}
                      onClick={() => handleConversationSelect(conversation)}
                    >
                      {conversation.name || 'Untitled Conversation'}
                    </div>
                  ))
                ) : selectedGroup ? (
                  <div className="empty-list-message">No conversations in this group</div>
                ) : (
                  <div className="empty-list-message">Select a group to view conversations</div>
                )}
              </div>
              <div className="new-conversation-container">
                <button className="new-conversation-btn">New Conversation</button>
              </div>
              
              {/* Templates section */}
              <div className="templates-header">
                <div className="templates-title">
                  {selectedGroup ? `${selectedGroup.name} Templates` : 'Templates'}
                </div>
              </div>
              <div className="templates-list">
                {loadingTemplates ? (
                  <div className="loading-message">Loading templates...</div>
                ) : templates.length > 0 ? (
                  templates.map(template => (
                    <div 
                      key={template.id}
                      className={`template-item ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      {template.name || 'Untitled Template'}
                    </div>
                  ))
                ) : selectedGroup ? (
                  <div className="empty-list-message">No templates in this group</div>
                ) : (
                  <div className="empty-list-message">Select a group to view templates</div>
                )}
              </div>
              <div className="new-template-container">
                <button className="new-conversation-btn">New Template</button>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="main-content">
              {selectedConversation ? (
                <div className="conversation-view">
                  <h2>{selectedConversation.name || 'Conversation'}</h2>
                  <div className="transcript">
                    {/* Placeholder for conversation transcript */}
                    <div className="message-placeholder">Select or create a conversation to begin</div>
                  </div>
                  <div className="message-input-container">
                    <textarea 
                      className="message-input" 
                      placeholder="Type your message here..."
                    ></textarea>
                    <button className="send-button">Send</button>
                  </div>
                </div>
              ) : selectedTemplate ? (
                <div className="template-view">
                  <h2>{selectedTemplate.name || 'Template'}</h2>
                  <div className="template-content">
                    {/* Placeholder for template content */}
                    <div className="content-placeholder">Template content will be displayed here</div>
                  </div>
                </div>
              ) : (
                <div className="placeholder-content">
                  <h2>Welcome to Conversational AI</h2>
                  <p>Select a conversation or template from the sidebar to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
