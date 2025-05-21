import React, { useState, useEffect } from 'react';
import AppHeader from './AppHeader';
import TopicsMenu from './topics/TopicsMenu';
import MessageArea from './messages/MessageArea';
import { getCurrentTopicPreference } from '../services/topics/topicsApi';
import './MainLayout.css';

/**
 * MainLayout component
 * Main layout container for the authenticated application
 */
const MainLayout = () => {
  const [selectedTopic, setSelectedTopic] = useState({ id: null, name: null });
  const [isLoading, setIsLoading] = useState(true);
  
  // Expose the setSelectedTopic function to the window object for cross-component communication
  useEffect(() => {
    // Create a wrapper function that can be called from other components
    window.setSelectedTopic = (topic) => {
      console.log('Setting selected topic via window object:', topic);
      
      // Update the selectedTopic state in MainLayout
      setSelectedTopic(topic);
      
      // Also call the handleTopicSelect function to ensure proper state updates
      // This is important because it will trigger any side effects like recording preferences
      if (topic && topic.id && topic.name) {
        handleTopicSelect(topic.id, topic.name);
      }
    };
    
    // Cleanup function to remove the global reference when component unmounts
    return () => {
      delete window.setSelectedTopic;
    };
  }, []);

  // Fetch and restore the user's most recently viewed topic when component mounts
  useEffect(() => {
    const restoreLastViewedTopic = async () => {
      try {
        setIsLoading(true);
        // Fetch the user's last viewed topic from their preferences
        const lastTopic = await getCurrentTopicPreference();
        
        if (lastTopic) {
          console.log('Restoring last viewed topic:', lastTopic);
          // Extract the actual topic ID from the value field
          const topicId = lastTopic.value;
          // Set the ID and try to get the name from the path
          const parts = lastTopic.path ? lastTopic.path.split('.') : [];
          const topicName = parts.length > 0 ? parts[parts.length - 1] : 'Unknown';
          
          setSelectedTopic({
            id: topicId,
            name: topicName
          });
        } else {
          console.log('No previous topic found');
        }
      } catch (error) {
        console.error('Error restoring last topic:', error);
        // Fail gracefully - if we can't restore the topic, the user starts fresh
      } finally {
        setIsLoading(false);
      }
    };
    
    restoreLastViewedTopic();
  }, []); // Empty dependency array ensures this only runs once on mount
  
  const handleTopicSelect = (topicId, topicName) => {
    setSelectedTopic({
      id: topicId,
      name: topicName
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
            {isLoading ? (
              <div className="loading-indicator">Restoring your last session...</div>
            ) : (
              <TopicsMenu 
                onTopicSelect={handleTopicSelect} 
                initialSelectedTopic={selectedTopic.id}
                selectedTopicId={selectedTopic.id} // Pass the current selected topic ID
              />
            )}
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
          {isLoading ? (
            <div className="loading-content">Loading your conversation history...</div>
          ) : (
            <MessageArea selectedTopic={selectedTopic} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
