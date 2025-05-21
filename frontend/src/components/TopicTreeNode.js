import React, { useState, useRef, useEffect } from 'react';
import { deleteTopicPath, updateTopicPath, setCurrentTopicPreference } from '../services/topics/topicsApi';
import './TopicsMenu.css';

/**
 * A single node in the topic tree
 * @param {Object} node - The topic node object
 * @param {number} level - The indentation level (depth) of this node
 * @param {Function} onAddChild - Callback when adding a child node
 * @param {Set} expandedPaths - Set of paths that are currently expanded
 * @param {Function} onToggleExpand - Callback when toggling node expansion
 * @param {Function} refreshTopics - Callback to refresh the topic tree
 * @param {Function} onSelect - Callback when a topic is selected
 * @param {boolean} isSelected - Whether this topic is currently selected (from restored session) 
 */
const TopicTreeNode = ({ node, level = 0, onAddChild, expandedPaths, onToggleExpand, refreshTopics, onSelect, isSelected = false, children }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.fullPath || node.name);
  const [lastClickTime, setLastClickTime] = useState(0);
  const inputRef = useRef(null);
  
  const hasChildren = node.children && node.children.length > 0;
  const nodePath = node.fullPath || node.name;
  const isExpanded = expandedPaths.has(nodePath);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  const toggleExpand = (e) => {
    e.stopPropagation();
    onToggleExpand(nodePath, !isExpanded);
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    // Get full path by joining node name with its parent path
    const fullPath = node.fullPath || node.name;
    onAddChild(fullPath);
  };

  const handleClick = async (e) => {
    e.stopPropagation();
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastClickTime;

    if (timeDiff < 300) { // Double click threshold
      setIsEditing(true);
    } else {
      try {
        // Call the onSelect callback, passing the numeric ID as the primary identifier
        // This ensures we're using DB IDs instead of path strings for lookups
        onSelect && onSelect(node.numericId, node.id, node.fullPath || node.name);
        
        // Record the topic selection as a participant preference
        // Use the numeric ID directly from the node data
        const topicId = node.numericId;
        
        // Only record preference if we have a valid topic ID
        if (topicId) {
          // Record this topic as the participant's current preference
          await setCurrentTopicPreference(topicId);
          console.log(`Recorded topic preference: ${topicId} - ${node.fullPath || node.name}`);
        }
      } catch (error) {
        console.error('Error recording topic preference:', error);
        // Don't block the UI if preference recording fails
      }
    }

    setLastClickTime(currentTime);
  };

  const handleEditSubmit = async () => {
    if (editValue.trim() === (node.fullPath || node.name)) {
      setIsEditing(false);
      return;
    }

    try {
      await updateTopicPath(nodePath, editValue.trim());
      await refreshTopics();
      setIsEditing(false);
    } catch (err) {
      alert(err.message);
      setEditValue(node.fullPath || node.name);
      setIsEditing(false);
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setEditValue(node.name);
      setIsEditing(false);
    }
  };

  const handleEditBlur = () => {
    handleEditSubmit();
  };

  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    const fullPath = node.fullPath || node.name;
    
    if (window.confirm(`Are you sure you want to delete the topic path "${fullPath}" and all its sub-topics?\n\nNote: In the future, we'll need to handle any posts that use these paths.`)) {
      try {
        await deleteTopicPath(fullPath);
        // Refresh the topic list
        await refreshTopics();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <li className="topic-item">
      <div 
        className={`topic-label ${isSelected ? 'topic-selected' : ''}`} 
        style={{ paddingLeft: `${level * 20}px` }}
      >
        <div className="topic-content" onClick={toggleExpand}>
          <span className="topic-icon">
            {hasChildren ? (isExpanded ? '▾' : '▸') : '•'}
          </span>
          <span 
            className="topic-name" 
            onClick={handleClick}
            title={node.fullPath || node.name}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                onBlur={handleEditBlur}
                className="topic-edit-input"
                onClick={(e) => e.stopPropagation()}
              />
            ) : node.name}
          </span>
        </div>
        <div className="topic-actions">
          <button 
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              width: '18px',
              height: '18px',
              borderRadius: '9px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              lineHeight: 1
            }}
            onClick={handleAddClick}
            title={`Add under ${node.name}`}
            type="button"
          >
            +
          </button>
          <button 
            className="delete-topic-btn" 
            onClick={handleDeleteClick}
            title={`Delete ${node.name}`}
          >
            −
          </button>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <ul className="topic-children">
          {node.children.map((child) => (
            <TopicTreeNode 
              key={child.id} 
              node={{
                ...child,
                fullPath: `${node.fullPath || node.name}.${child.name}`
              }}
              level={level + 1}
              onAddChild={onAddChild}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              refreshTopics={refreshTopics}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default TopicTreeNode;
