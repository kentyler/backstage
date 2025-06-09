import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

/**
 * Invite Acceptance Component
 * Handles accepting invitations via URL tokens
 */
const InviteAcceptance = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const token = searchParams.get('token');

  // Load invitation details on mount
  useEffect(() => {
    if (!token) {
      setMessage('Invalid invitation link');
      setLoading(false);
      return;
    }

    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      const response = await fetch(`/api/auth/invite/${token}`);
      const data = await response.json();

      if (data.success) {
        setInvitation(data.invitation);
      } else {
        setMessage(data.message || 'Invitation not found or expired');
      }
    } catch (error) {
      console.error('🔐 INVITE: Error loading invitation:', error);
      setMessage('Error loading invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setMessage('Name is required');
      return;
    }

    if (!password || password.length < 8) {
      setMessage('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setAccepting(true);
    setMessage('');

    try {
      const response = await fetch(`/api/auth/invite/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          password
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Account created successfully! You can now log in.');
        setIsSuccess(true);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setMessage(data.message || 'Failed to accept invitation');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('🔐 INVITE: Error accepting invitation:', error);
      setMessage('Error accepting invitation');
      setIsSuccess(false);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="invite-acceptance">
        <div className="invite-header">
          <h2>🔐 Processing Invitation</h2>
        </div>
        <div className="loading">Loading invitation details...</div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="invite-acceptance">
        <div className="invite-header">
          <h2>🔐 Invitation</h2>
        </div>
        <div className="error-message">{message}</div>
        <button 
          onClick={() => navigate('/')} 
          className="auth-button"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="invite-acceptance">
        <div className="invite-header">
          <h2>🎉 Welcome!</h2>
        </div>
        <div className="success-message">
          {message}
          <br />
          <small>Redirecting to login...</small>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-acceptance">
      <div className="invite-header">
        <h2>🔐 Accept Invitation</h2>
      </div>

      <div className="invite-details">
        <div className="invite-info">
          <strong>You've been invited to join!</strong>
          <div>Email: {invitation.email}</div>
          <div>Invited by: {invitation.invited_by_name} ({invitation.invited_by_email})</div>
          <div>Expires: {new Date(invitation.expires_at).toLocaleDateString()}</div>
        </div>
      </div>

      <form onSubmit={handleAccept} className="accept-form">
        <div className="form-group">
          <label>Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            disabled={accepting}
            required
          />
        </div>

        <div className="form-group">
          <label>Choose Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            disabled={accepting}
            required
          />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            disabled={accepting}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={accepting || !name.trim() || !password || !confirmPassword}
          className="auth-button"
        >
          {accepting ? 'Creating Account...' : 'Accept Invitation'}
        </button>
      </form>

      {message && (
        <div className={`message ${isSuccess ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default InviteAcceptance;