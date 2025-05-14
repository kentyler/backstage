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
  const [groups, setGroups] = useState([]);
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
      
      // If authenticated, also fetch groups
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
      const groups = await apiService.getGroups();
      console.log('Groups response:', groups);
      setGroups(groups);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to fetch groups');
    }
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
      <header className="app-header">
        <h1>Express React Authentication Test</h1>
        <p className="subtitle">A minimal app to debug authentication issues</p>
      </header>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="content">
        {!authStatus.authenticated ? (
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
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loadingAction || !loginForm.username || !loginForm.password}
              >
                {loadingAction ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <p className="note">
              For testing: any username/password combo works
            </p>
          </div>
        ) : (
          <div className="user-profile">
            <div className="welcome">
              <h2>Welcome, {authStatus.user.username}!</h2>
              <button onClick={handleLogout} disabled={loadingAction}>
                {loadingAction ? 'Logging out...' : 'Logout'}
              </button>
            </div>
            
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
        )}
      </div>
      
      <footer>
        <div className="connection-status">
          <h3>Connection Status</h3>
          <div>
            <strong>Backend:</strong> Express on port 5000
          </div>
          <div>
            <strong>Authentication Status:</strong> {authStatus.authenticated ? 
              `Authenticated (User: ${authStatus.user.username})` : 
              'Not authenticated'}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
