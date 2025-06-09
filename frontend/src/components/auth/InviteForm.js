import React, { useState } from 'react';

/**
 * Invite Form Component
 * Allows authenticated participants to invite others via email
 */
const InviteForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('Email is required');
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`Invitation sent to ${email}`);
        setIsSuccess(true);
        setEmail('');
      } else {
        setMessage(data.message || 'Failed to send invitation');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('🔐 AUTH: Error sending invitation:', error);
      setMessage('Error sending invitation');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invite-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            placeholder="Enter email to invite"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="invite-input"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading || !email.trim()}
          className="invite-button"
        >
          {loading ? 'Sending...' : 'Send Invite'}
        </button>
      </form>

      {message && (
        <div className={`invite-message ${isSuccess ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default InviteForm;