import React, { useState } from 'react';
import { useAuth } from '../../services/auth/authContext';
import './AuthColumn.css';

/**
 * Clean Login form - only handles authentication
 * No navigation, just pure login functionality
 */
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔐 LOGIN FORM: Submitting login form');

    try {
      const result = await login(email, password);
      
      if (result.success) {
        console.log('🔐 LOGIN FORM: Login successful - auth context will handle state');
        // Clear form on success
        setEmail('');
        setPassword('');
      } else {
        console.log('🔐 LOGIN FORM: Login failed:', result.error);
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('🔐 LOGIN FORM: Login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-column">
      <div className="auth-header">
        <h3>🔐 Authentication</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="login-form">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`auth-button ${loading ? 'loading' : ''}`}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
