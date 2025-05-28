/**
 * CONSOLIDATED FILE: Frontend Components
 * 
 * This file contains the key frontend React components:
 * 1. Message area and chat interface
 * 2. File upload components
 * 3. Topic management
 * 4. State management
 */

//=============================================================================
// MESSAGE AREA AND CHAT INTERFACE
//=============================================================================

/**
 * MessageArea component - Main chat interface
 * Path: frontend/src/components/messages/MessageArea.js
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import MessageItem from './components/MessageItem';
import MessageInput from './components/MessageInput';
import FileUploadButton from '../fileUpload/FileUploadButton';
import { getMessages, sendMessage } from '../../services/messageService';
import { useAuth } from '../../contexts/AuthContext';
import './MessageArea.css';

const MessageArea = () => {
  const { topicId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Fetch messages on component mount and when topicId changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!topicId) return;
      
      try {
        setLoading(true);
        const data = await getMessages(topicId);
        setMessages(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [topicId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle sending a new message
  const handleSendMessage = async (content) => {
    if (!content.trim() || !topicId || !user) return;
    
    try {
      setSending(true);
      
      // Optimistic update - add message to UI immediately
      const tempMessage = {
        id: `temp-${Date.now()}`,
        content,
        messageType: 1, // User message
        senderName: user.name,
        avatarUrl: user.avatarUrl,
        timestamp: new Date().toISOString(),
        isTemporary: true
      };
      
      setMessages([...messages, tempMessage]);
      
      // Send message to server
      const response = await sendMessage({
        topicId,
        content,
        participantId: user.participantId,
        messageType: 1 // User message
      });
      
      // Replace temporary message with actual message from server
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id ? response : msg
        )
      );
      
      // Add any response message from assistant
      if (response.assistantResponse) {
        setMessages(prev => [...prev, response.assistantResponse]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  // Handle file upload completion
  const handleFileUploaded = (fileData) => {
    // Refresh messages to include the new file message
    getMessages(topicId)
      .then(data => {
        setMessages(data);
      })
      .catch(err => {
        console.error('Error fetching messages after file upload:', err);
      });
  };
  
  return (
    <div className="message-area">
      <div className="message-container">
        {loading && <div className="loading">Loading messages...</div>}
        
        {error && <div className="error-message">{error}</div>}
        
        {messages.length === 0 && !loading && (
          <div className="empty-state">
            No messages yet. Start the conversation!
          </div>
        )}
        
        {messages.map(message => (
          <MessageItem 
            key={message.id} 
            message={message} 
            isCurrentUser={message.participantId === user?.participantId}
          />
        ))}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="message-input-container">
        <FileUploadButton 
          topicId={topicId}
          participantId={user?.participantId}
          onUploadComplete={handleFileUploaded}
        />
        
        <MessageInput 
          onSendMessage={handleSendMessage}
          disabled={sending || !user}
          sending={sending}
        />
      </div>
    </div>
  );
};

export default MessageArea;

/**
 * MessageItem component - Individual message in the chat
 * Path: frontend/src/components/messages/components/MessageItem.js
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import './MessageItem.css';

const MessageItem = ({ message, isCurrentUser }) => {
  // Determine message type and apply appropriate styling
  const getMessageClass = () => {
    const baseClass = 'message-item';
    
    if (isCurrentUser) {
      return `${baseClass} current-user`;
    }
    
    switch (message.messageType) {
      case 0: // System
        return `${baseClass} system-message`;
      case 1: // User
        return `${baseClass} user-message`;
      case 2: // Assistant
        return `${baseClass} assistant-message`;
      case 3: // File
        return `${baseClass} file-message`;
      default:
        return baseClass;
    }
  };
  
  // Format the timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };
  
  // Render file message
  const renderFileMessage = () => {
    if (message.turnKind !== 6) return null; // Not a file message
    
    // Extract file info from message content
    const fileMatch = message.content.match(/File uploaded: (.*) \(ID: (\d+)\)/);
    
    if (!fileMatch) {
      return <p>{message.content}</p>;
    }
    
    const [, fileName, fileId] = fileMatch;
    
    return (
      <div className="file-upload-container">
        <div className="file-icon">📄</div>
        <div className="file-details">
          <span className="file-name">{fileName}</span>
          <span className="file-id">ID: {fileId}</span>
        </div>
      </div>
    );
  };
  
  return (
    <div className={getMessageClass()}>
      <div className="message-avatar">
        {message.avatarUrl ? (
          <img src={message.avatarUrl} alt={message.senderName} />
        ) : (
          <div className="default-avatar">
            {message.senderName ? message.senderName[0].toUpperCase() : '?'}
          </div>
        )}
      </div>
      
      <div className="message-content">
        <div className="message-header">
          <span className="sender-name">{message.senderName || 'Unknown'}</span>
          <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
        </div>
        
        <div className="message-body">
          {message.turnKind === 6 ? (
            renderFileMessage()
          ) : (
            <p>{message.content}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;

//=============================================================================
// FILE UPLOAD COMPONENTS
//=============================================================================

/**
 * FileUploadButton component
 * Path: frontend/src/components/fileUpload/FileUploadButton.js
 */

import React, { useState, useRef } from 'react';
import { uploadFile } from '../../services/fileService';
import './FileUploadButton.css';

const FileUploadButton = ({ topicId, participantId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  // Handle file selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    if (!topicId || !participantId) {
      setError('Topic or participant information missing.');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      setProgress(0);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload file with progress tracking
      const response = await uploadFile(formData, topicId, participantId, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        setProgress(progress);
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Callback to parent component
      if (onUploadComplete) {
        onUploadComplete(response);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };
  
  // Trigger file input click
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="file-upload-button-container">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".txt,.pdf,.doc,.docx,.csv,.json"
      />
      
      <button
        className="file-upload-button"
        onClick={handleButtonClick}
        disabled={uploading || !topicId || !participantId}
      >
        {uploading ? (
          <span>Uploading... {progress}%</span>
        ) : (
          <span>📎 Attach</span>
        )}
      </button>
      
      {error && <div className="file-upload-error">{error}</div>}
    </div>
  );
};

export default FileUploadButton;

/**
 * FileService for API communication
 * Path: frontend/src/services/fileService.js
 */

import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getAuthHeaders } from './authService';

/**
 * Upload a file to the server
 * @param {FormData} formData - Form data containing the file
 * @param {number} topicId - Topic ID
 * @param {number} participantId - Participant ID
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Upload response
 */
export const uploadFile = async (formData, topicId, participantId, onProgress) => {
  try {
    const url = `${API_BASE_URL}/api/file-uploads?topicId=${topicId}&participantId=${participantId}`;
    
    const response = await axios.post(url, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress
    });
    
    return response.data;
  } catch (error) {
    console.error('Error in uploadFile:', error);
    
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to upload file');
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error('Error setting up file upload request');
    }
  }
};

/**
 * Get file metadata by ID
 * @param {number} fileId - File ID
 * @returns {Promise<Object>} File metadata
 */
export const getFileMetadata = async (fileId) => {
  try {
    const url = `${API_BASE_URL}/api/file-uploads/${fileId}`;
    
    const response = await axios.get(url, {
      headers: getAuthHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error('Error in getFileMetadata:', error);
    
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to get file metadata');
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error('Error setting up file metadata request');
    }
  }
};

//=============================================================================
// TOPIC MANAGEMENT COMPONENTS
//=============================================================================

/**
 * TopicList component
 * Path: frontend/src/components/topics/TopicList.js
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTopics, createTopic } from '../../services/topicService';
import { useAuth } from '../../contexts/AuthContext';
import './TopicList.css';

const TopicList = () => {
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Fetch topics on component mount
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const data = await getTopics(user?.participantId);
        setTopics(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching topics:', err);
        setError('Failed to load topics. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchTopics();
    }
  }, [user]);
  
  // Handle creating a new topic
  const handleCreateTopic = async (e) => {
    e.preventDefault();
    
    if (!newTopicTitle.trim() || !user) return;
    
    try {
      setCreating(true);
      
      const newTopic = await createTopic({
        title: newTopicTitle,
        participantId: user.participantId
      });
      
      // Add new topic to list
      setTopics([newTopic, ...topics]);
      
      // Reset form
      setNewTopicTitle('');
    } catch (err) {
      console.error('Error creating topic:', err);
      setError('Failed to create topic. Please try again.');
    } finally {
      setCreating(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="topic-list-container">
      <h2>Your Conversations</h2>
      
      {user && (
        <form className="new-topic-form" onSubmit={handleCreateTopic}>
          <input
            type="text"
            value={newTopicTitle}
            onChange={(e) => setNewTopicTitle(e.target.value)}
            placeholder="New conversation title..."
            disabled={creating}
          />
          <button type="submit" disabled={creating || !newTopicTitle.trim()}>
            {creating ? 'Creating...' : 'Start New'}
          </button>
        </form>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">Loading topics...</div>
      ) : topics.length === 0 ? (
        <div className="empty-state">
          No conversations yet. Start a new one!
        </div>
      ) : (
        <ul className="topic-list">
          {topics.map(topic => (
            <li key={topic.id} className="topic-item">
              <Link to={`/topics/${topic.id}`} className="topic-link">
                <div className="topic-title">{topic.title}</div>
                <div className="topic-meta">
                  <span className="topic-date">{formatDate(topic.created_at)}</span>
                  <span className="topic-message-count">
                    {topic.message_count || 0} messages
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TopicList;

//=============================================================================
// STATE MANAGEMENT AND CONTEXT
//=============================================================================

/**
 * Auth Context
 * Path: frontend/src/contexts/AuthContext.js
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { login, logout, refreshToken, getUser } from '../services/authService';

// Create context
const AuthContext = createContext();

// Custom hook for accessing auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize auth state on component mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        
        // Check for existing token
        const token = localStorage.getItem('authToken');
        
        if (token) {
          // Verify token and get user info
          const userData = await getUser();
          setUser(userData);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        // Clear invalid token
        localStorage.removeItem('authToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);
  
  // Handle login
  const handleLogin = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const { user, token } = await login(credentials);
      
      // Store token
      localStorage.setItem('authToken', token);
      
      // Set user state
      setUser(user);
      
      return user;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      
      await logout();
      
      // Clear token
      localStorage.removeItem('authToken');
      
      // Clear user state
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Context value
  const value = {
    user,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout,
    isAuthenticated: !!user
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * App component - Main application entry point
 * Path: frontend/src/App.js
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TopicListPage from './pages/TopicListPage';
import TopicDetailPage from './pages/TopicDetailPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/routing/ProtectedRoute';
import './App.css';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Header />
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              <Route 
                path="/topics" 
                element={
                  <ProtectedRoute>
                    <TopicListPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/topics/:topicId" 
                element={
                  <ProtectedRoute>
                    <TopicDetailPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
