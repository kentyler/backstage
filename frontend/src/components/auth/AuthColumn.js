import React, { useState } from 'react';
import { useAuth } from '../../services/auth/authContext';
import LoginForm from './LoginForm';
import LogoutButton from './LogoutButton';
import InviteForm from './InviteForm';
import './AuthColumn.css';

/**
 * Auth Column Component
 * Shows login form when not authenticated, user info when authenticated
 * Only handles auth - passes clientId and participantId to other columns
 */
const AuthColumn = () => {
  const { isAuthenticated, user, participantId, clientId, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-column">
        <div className="auth-header">
          <h3>🔐 Authentication</h3>
        </div>
        <div className="auth-loading">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="auth-column">
      <div className="auth-header">
        <h3>🔐 Authentication</h3>
      </div>
      
      <div className="auth-user-info">
        <div className="user-details">
          <strong>Logged in as:</strong>
          <div>{user?.email}</div>
          <div className="user-ids">
            <small>Participant ID: {participantId}</small>
            <br />
            <small>Client ID: {clientId}</small>
          </div>
        </div>
        
        <LogoutButton />
      </div>
      
      <div className="auth-invite-section">
        <h4>Invite Participants</h4>
        <InviteForm />
      </div>
      
      <div className="auth-status">
        <div className="status-item">
          ✅ Authenticated
        </div>
        <div className="status-item">
          📤 Providing client_id: <strong>{clientId}</strong>
        </div>
        <div className="status-item">
          📤 Providing participant_id: <strong>{participantId}</strong>
        </div>
      </div>
    </div>
  );
};

export default AuthColumn;