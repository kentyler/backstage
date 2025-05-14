import React, { useState, useEffect } from 'react';
import './App.css';
import { apiService } from './services/apiService';
import DatabaseTest from './components/DatabaseTest';

function App() {
  const [authStatus, setAuthStatus] = useState({
    loading: true,
    authenticated: false,
    user: null
  });
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setAuthStatus(prev => ({ ...prev, loading: true }));
      const response = await apiService.getAuthStatus();
      
      console.log('Auth status response:', response);
      
      setAuthStatus({
        loading: false,
        authenticated: response.authenticated,
        user: response.user
      });
      
      // If authenticated, fetch groups first, then conversations
      if (response.authenticated) {
        fetchGroups();
      }
    } catch (err) {
      console.error('Error checking authentication status:', err);
      setAuthStatus({
        loading: false,
        authenticated: false,
        user: null
      });
      setError('Failed to check authentication status');
    }
  };

  const fetchGroups = async () => {
    try {
      const groupsData = await apiService.getGroups();
      console.log('Groups response:', groupsData);
      setGroups(groupsData);
      
      // Set the first group as selected by default if groups exist
      if (groupsData && groupsData.length > 0) {
        setSelectedGroupId(groupsData[0].id);
        // Fetch conversations for the first group
        fetchConversations(groupsData[0].id);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to fetch groups');
    }
  };
  
  const fetchConversations = async (groupId = null) => {
    try {
      // Use either the provided groupId or the currently selected one
      const targetGroupId = groupId || selectedGroupId;
      
      if (!targetGroupId) {
        console.log('No group selected, skipping conversation fetch');
        return;
      }
      
      const conversationData = await apiService.getConversations(targetGroupId);
      console.log(`Conversations for group ${targetGroupId}:`, conversationData);
      setConversations(conversationData);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to fetch conversations');
    }
  };
  
  // Handle group selection change
  const handleGroupChange = (e) => {
    const newGroupId = e.target.value;
    console.log('Selected group changed to:', newGroupId);
    setSelectedGroupId(newGroupId);
    fetchConversations(newGroupId);
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoadingAction(true);
      setError(null);
      
      await apiService.login(loginForm.username, loginForm.password);
      await checkAuthStatus(); // Refresh auth status
      
      setLoginForm({ username: '', password: '' });
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoadingAction(true);
      await apiService.logout();
      
      // Clear state
      setAuthStatus({
        loading: false,
        authenticated: false,
        user: null
      });
      setGroups([]);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Logout failed');
    } finally {
      setLoadingAction(false);
    }
  };

  if (authStatus.loading) {
    return <div className="app loading">Checking authentication status...</div>;
  }

  return (
    <div className="app">
      {!authStatus.authenticated ? (
        // Login form when not authenticated
        <div className="content">
          <header className="app-header">
            <h1>Conversational AI</h1>
            <p className="subtitle">Authentication System</p>
          </header>
          
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}
          
          <div className="auth-form">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={loginForm.username}
                  onChange={handleLoginChange}
                  required
                  autoComplete="username"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  required
                  autoComplete="current-password"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loadingAction || !loginForm.username || !loginForm.password}
                className="login-button"
              >
                {loadingAction ? 'Logging in...' : 'Login'}
              </button>
              <p className="note">
                For testing: any username/password combo works
              </p>
            </form>
          </div>
        </div>
      ) : (
        // Main content structure when authenticated
        <div className="app-container">
          {/* Navigation bar - only shown when authenticated */}
          <nav id="main-nav">
            <div className="nav-content">
              <div className="brand">Conversational AI: {authStatus.user?.schema || 'dev'}</div>
              <div className="user-info">
                <div className="user-controls">
                  <span className="user-name">Welcome, {authStatus.user.username}!</span>
                  <div className="group-select">
                    {groups.length > 0 && (
                      <select 
                        className="header-dropdown" 
                        value={selectedGroupId || ''}
                        onChange={handleGroupChange}
                      >
                        <option value="">Select a group</option>
                        {groups.map(group => (
                          <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <button id="logout-button" onClick={handleLogout} disabled={loadingAction}>
                  {loadingAction ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          </nav>
          
          <div className="main-layout">
            <div className="app-layout">
              {/* Left sidebar for conversations */}
              <div id="conversations-column" className="sidebar">
                <div className="sidebar-header">
                  <h3>Conversations</h3>
                  <button className="action-button">+ New</button>
                </div>
                <div className="sidebar-list">
                  {conversations.length > 0 ? (
                    <ul className="groups-list">
                      {conversations.map(conversation => (
                        <li 
                          key={conversation.id} 
                          onClick={() => alert(`You clicked: ${conversation.name}`)}
                          className="clickable-group"
                        >
                          {conversation.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No conversations found.</p>
                  )}
                </div>
              </div>
              
              {/* Main conversation area */}
              <div id="conversation-area" className="main-area">
                <div className="conversation-header">
                  <h2>Conversation</h2>
                  <div className="conversation-actions">
                    {/* Additional conversation actions can go here */}
                  </div>
                </div>
                
                <div className="transcript"></div>
                
                <div className="input-area">
                  <div className="user-input" contentEditable="true" placeholder="Type your message..."></div>
                  <button className="send-button">Send</button>
                </div>
              </div>
            </div>
            
            <div className="debug-section">
              <h3>Debug Information</h3>
              <div className="data-section">
                <h3>Groups Data</h3>
                {groups.length > 0 ? (
                  <ul className="groups-list">
                    {groups.map(group => (
                      <li key={group.id}>{group.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No groups found.</p>
                )}
              </div>
              
              <DatabaseTest />
            </div>
          </div>
        </div>
      )}
      
      {/* Debug overlay */}
      <div id="debug-overlay"></div>
    </div>
  );
}

export default App;
