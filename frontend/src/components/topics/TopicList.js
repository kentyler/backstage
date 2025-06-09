import React from 'react';
import TopicItem from './TopicItem';

/**
 * Topic List Component
 * Displays a list of topics in a hierarchical tree structure
 */
const TopicList = ({ 
  topics, 
  editingTopicId, 
  onStartEdit, 
  onCancelEdit, 
  onSaveEdit, 
  onDelete,
  onTopicSelect
}) => {
  
  // Helper function to build a hierarchical tree from flat topic paths
  const buildTopicTree = (topicPaths) => {
    const tree = {};
    
    topicPaths.forEach(topic => {
      const pathParts = topic.path.split('.');
      let currentLevel = tree;
      
      pathParts.forEach((part, index) => {
        if (!currentLevel[part]) {
          currentLevel[part] = {
            name: part,
            fullPath: pathParts.slice(0, index + 1).join('.'),
            children: {},
            topic: null // Will hold the actual topic data if this level has a topic
          };
        }
        
        // If this is the last part, attach the topic data
        if (index === pathParts.length - 1) {
          currentLevel[part].topic = topic;
        }
        
        currentLevel = currentLevel[part].children;
      });
    });
    
    return tree;
  };

  // Helper function to render the tree recursively
  const renderTreeLevel = (treeLevel, depth = 0) => {
    return Object.entries(treeLevel).map(([name, node]) => (
      <div key={node.fullPath} className="topic-node" style={{ marginLeft: `${depth * 20}px` }}>
        <TopicItem
          topic={node.topic}
          name={name}
          fullPath={node.fullPath}
          hasChildren={Object.keys(node.children).length > 0}
          isEditing={editingTopicId === node.topic?.id}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          onSaveEdit={onSaveEdit}
          onDelete={onDelete}
          onTopicSelect={onTopicSelect}
          depth={depth}
        />
        
        {/* Render children if they exist */}
        {Object.keys(node.children).length > 0 && (
          <div className="topic-children">
            {renderTreeLevel(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (!topics || topics.length === 0) {
    return null;
  }

  const topicTree = buildTopicTree(topics);

  return (
    <div className="topic-list">
      {renderTreeLevel(topicTree)}
    </div>
  );
};

export default TopicList;