import React, { useState, useRef, useEffect } from 'react';
import { deleteTopicPath, updateTopicPath } from '../services/topics/topicsApi';
import './TopicsMenu.css';

/**
 * A single node in the topic tree
 */
const TopicTreeNode = ({ node, level = 0, onAddChild, expandedPaths, onToggleExpand, refreshTopics }) => {
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

  const handleClick = (e) => {
    e.stopPropagation();
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastClickTime;

    if (timeDiff < 300) { // Double click threshold
      setIsEditing(true);
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
        className="topic-label" 
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
            className="add-subtopic-btn" 
            onClick={handleAddClick}
            title={`Add under ${node.name}`}
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
