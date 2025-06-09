import React, { useEffect, useState } from 'react';
import './App.css';

// Auth components
import { AuthProvider, useAuth } from './services/auth/authContext';
import AuthColumn from './components/auth/AuthColumn';
import GroupsColumn from './components/groups/GroupsColumn';
import TopicsColumn from './components/topics/TopicsColumn';
import PromptResponseColumn from './components/prompts/PromptResponseColumn';
import HistoryColumn from './components/history/HistoryColumn';

/**
 * 5-column App - Auth + Groups + Topics + Prompts + History
 * Clean layout focusing on core functionality
 */
function App() {
  console.log('📱 APP: Rendering...');
  
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { checkAuth, isAuthenticated } = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroupName, setSelectedGroupName] = useState('');
  
  // Column visibility state
  const [showAuthColumn, setShowAuthColumn] = useState(true);
  const [showGroupsColumn, setShowGroupsColumn] = useState(true);
  const [showTopicsColumn, setShowTopicsColumn] = useState(true);
  const [showPromptColumn, setShowPromptColumn] = useState(true);
  const [showHistoryColumn, setShowHistoryColumn] = useState(true);
  
  // Topic selection for prompt column
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [selectedTopicName, setSelectedTopicName] = useState('');
  
  useEffect(() => {
    console.log('📱 APP: Checking auth status on mount...');
    checkAuth();
  }, [checkAuth]);

  const handleGroupSelect = (groupId, groupName) => {
    console.log('📱 APP: Group selected', { 
      groupId, 
      groupIdType: typeof groupId, 
      groupName, 
      groupNameType: typeof groupName 
    });
    setSelectedGroupId(groupId);
    setSelectedGroupName(groupName);
  };

  const handleTopicSelect = (topicId, topicPath) => {
    console.log('📱 APP: Topic selected for prompting', { topicId, topicPath });
    setSelectedTopicId(topicId);
    setSelectedTopicName(topicPath);
    
    // Ensure both prompt and history columns are visible when topic is selected
    setShowPromptColumn(true);
    setShowHistoryColumn(true);
  };
  
  // Calculate visible columns for layout class
  const visibleColumns = [
    showAuthColumn,
    isAuthenticated && showGroupsColumn,
    isAuthenticated && selectedGroupId && showTopicsColumn,
    isAuthenticated && selectedTopicId && showPromptColumn,
    isAuthenticated && selectedTopicId && showHistoryColumn
  ].filter(Boolean).length;
  
  const layoutClass = visibleColumns === 5 ? "five-column-layout" :
                     visibleColumns === 4 ? "four-column-layout" :
                     visibleColumns === 3 ? "three-column-layout" : 
                     visibleColumns === 2 ? "two-column-layout" : "one-column-layout";

  return (
    <div className="app-container">
      {/* Column Toggle Bar */}
      <div className="column-toggles">
        <button 
          onClick={() => setShowAuthColumn(!showAuthColumn)}
          className={`toggle-btn ${showAuthColumn ? 'active' : 'inactive'}`}
        >
          🔐 Auth {showAuthColumn ? '▼' : '▶'}
        </button>
        
        {isAuthenticated && (
          <button 
            onClick={() => setShowGroupsColumn(!showGroupsColumn)}
            className={`toggle-btn ${showGroupsColumn ? 'active' : 'inactive'}`}
          >
            🏢 Groups {showGroupsColumn ? '▼' : '▶'}
          </button>
        )}
        
        {isAuthenticated && selectedGroupId && (
          <button 
            onClick={() => setShowTopicsColumn(!showTopicsColumn)}
            className={`toggle-btn ${showTopicsColumn ? 'active' : 'inactive'}`}
          >
            📚 Topics {showTopicsColumn ? '▼' : '▶'}
          </button>
        )}
        
        {isAuthenticated && selectedTopicId && (
          <button 
            onClick={() => setShowPromptColumn(!showPromptColumn)}
            className={`toggle-btn ${showPromptColumn ? 'active' : 'inactive'}`}
          >
            💬 Prompts {showPromptColumn ? '▼' : '▶'}
          </button>
        )}
        
        {isAuthenticated && selectedTopicId && (
          <button 
            onClick={() => setShowHistoryColumn(!showHistoryColumn)}
            className={`toggle-btn ${showHistoryColumn ? 'active' : 'inactive'}`}
          >
            📜 History {showHistoryColumn ? '▼' : '▶'}
          </button>
        )}
      </div>

      <div className={layoutClass}>
        
        {/* Column 1: Authentication */}
        {showAuthColumn && (
          <div className="column auth-column-wrapper">
            <AuthColumn />
          </div>
        )}
        
        {/* Column 2: Groups - Only visible when authenticated */}
        {isAuthenticated && showGroupsColumn && (
          <div className="column groups-column-wrapper">
            <GroupsColumn 
              selectedGroupId={selectedGroupId}
              onGroupSelect={handleGroupSelect}
            />
          </div>
        )}
        
        {/* Column 3: Topics - Only visible when group is selected */}
        {isAuthenticated && selectedGroupId && showTopicsColumn && (
          <div className="column topics-column-wrapper">
            <TopicsColumn 
              selectedGroupId={selectedGroupId}
              selectedGroupName={selectedGroupName}
              onTopicSelect={handleTopicSelect}
            />
          </div>
        )}
        
        {/* Column 4: Prompt Response - Only visible when topic is selected */}
        {isAuthenticated && selectedTopicId && showPromptColumn && (
          <div className="column prompt-response-column-wrapper">
            <PromptResponseColumn 
              selectedTopicId={selectedTopicId}
              selectedTopicName={selectedTopicName}
            />
          </div>
        )}
        
        {/* Column 5: History - Only visible when topic is selected */}
        {isAuthenticated && selectedTopicId && showHistoryColumn && (
          <div className="column history-column-wrapper">
            <HistoryColumn 
              selectedTopicId={selectedTopicId}
              selectedTopicName={selectedTopicName}
            />
          </div>
        )}
        
      </div>
    </div>
  );
}

export default App;