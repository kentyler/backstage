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
  const [selectedTopic, setSelectedTopic] = useState(null);

  return (
    <div className="main-layout">
      <AppHeader />
      <table className="app-container">
        <tbody>
          <tr>
            <td className="topics-cell">
              <TopicsMenu onTopicSelect={setSelectedTopic} />
            </td>
            <td className="content-cell">
              <MessageArea selectedTopic={selectedTopic} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default MainLayout;
