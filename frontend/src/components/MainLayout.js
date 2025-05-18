import React, { useState } from 'react';
import AppHeader from './AppHeader';
import TopicsMenu from './TopicsMenu';
import MessageArea from './MessageArea';
import './MainLayout.css';

/**
 * MainLayout component
 * Main layout container for the authenticated application
 */
const MainLayout = () => {
  const [selectedTopic, setSelectedTopic] = useState({
    id: null,
    path: null
  });
  
  const handleTopicSelect = (topicId, topicPath) => {
    setSelectedTopic({
      id: topicId,
      path: topicPath
    });
  };

  return (
    <div className="app">
      <div className="app-content">
        <div className="sidebar">
          <div className="sidebar-header">
            <h1>Conversational AI</h1>
          </div>
          <div className="sidebar-content">
            <TopicsMenu onTopicSelect={handleTopicSelect} />
          </div>
          <div className="sidebar-footer">
            <button 
              className="logout-button"
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
            >
              Logout
            </button>
          </div>
        </div>
        <div className="main-content">
          <MessageArea selectedTopic={selectedTopic} />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
