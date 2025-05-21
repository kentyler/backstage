import React, { useState, useEffect } from 'react';
import { fetchTopicPaths, createTopicPath } from '../../services/topics/topicsApi';
import TopicTreeNode from './TopicTreeNode';
import './TopicsMenu.css';

/**
 * Convert flat path list to tree structure
 */
const buildTopicTree = (paths) => {
  const root = { children: [], name: 'root' };
  
  paths.forEach(path => {
    const parts = path.path.split('.');
    let current = root;
    
    parts.forEach((part, index) => {
      let child = current.children.find(c => c.name === part);
      
      if (!child) {
        child = {
          id: `${path.index}_${index}`, // Using index for backward compatibility
          numericId: path.id,          // New numeric ID for preferences
          name: part,
          children: [],
          isLeaf: index === parts.length - 1
        };
        current.children.push(child);
      }
      
      current = child;
    });
  });
  
  return root.children;
};

/**
 * TopicsMenu component
 * Displays a hierarchical tree of topic paths
 * @param {Function} onTopicSelect - Callback when a topic is selected
 * @param {string} initialSelectedTopic - Initial topic ID to select (if restoring session)
 * @param {string} selectedTopicId - Current selected topic ID (for updates)
 */
const TopicsMenu = ({ onTopicSelect, initialSelectedTopic, selectedTopicId: propSelectedTopicId }) => {
  const [topicTree, setTopicTree] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newPath, setNewPath] = useState('');
  const [addError, setAddError] = useState(null);
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  // Use internal state that's initialized with initialSelectedTopic
  const [internalSelectedTopicId, setInternalSelectedTopicId] = useState(initialSelectedTopic || null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Use the prop value if provided, otherwise use the internal state
  // This allows the component to be controlled from outside
  const selectedTopicId = propSelectedTopicId !== undefined ? propSelectedTopicId : internalSelectedTopicId;

  useEffect(() => {
    const loadTopicPaths = async () => {
      try {
        const paths = await fetchTopicPaths();
        const tree = buildTopicTree(paths);
        setTopicTree(tree);
        setError(null);
      } catch (err) {
        console.error('Failed to load topic paths:', err);
        setError('Failed to load topics');
      } finally {
        setLoading(false);
      }
    };

    loadTopicPaths();
  }, []);

  const refreshTopics = async () => {
    try {
      const paths = await fetchTopicPaths();
      setTopics(paths);
      const tree = buildTopicTree(paths);
      setTopicTree(tree);
      return paths;
    } catch (error) {
      console.error('Error refreshing topics:', error);
      setError('Failed to refresh topics');
      throw error;
    }
  };

  /**
   * Sanitize a topic path to ensure it's compatible with PostgreSQL ltree
   * @param {string} path - The path to sanitize
   * @returns {string} The sanitized path
   */
  const sanitizeTopicPath = (path) => {
    // Replace spaces with underscores and remove any invalid characters
    // ltree only allows letters, digits, and underscores in node labels
    return path.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.]/g, '');
  };

  const handleAddPath = async (e) => {
    e.preventDefault();
    if (!newPath.trim()) return;

    try {
      setAddError(null);
      const sanitizedPath = sanitizeTopicPath(newPath);
      await createTopicPath(sanitizedPath);
      
      // Auto-expand all parent paths of the new path
      const pathParts = sanitizedPath.split('.');
      const newExpandedPaths = new Set(expandedPaths);
      let currentPath = '';
      
      // Add each parent path to expanded set
      pathParts.forEach((part, index) => {
        if (index === 0) {
          currentPath = part;
        } else {
          currentPath += '.' + part;
        }
        if (index < pathParts.length - 1) { // Don't expand the last part
          newExpandedPaths.add(currentPath);
        }
      });
      
      setExpandedPaths(newExpandedPaths);
      await refreshTopics();
      setNewPath('');
      setIsAdding(false);
    } catch (err) {
      setAddError(err.message);
    }
  };

  const handleAddChild = (parentPath) => {
    setNewPath(`${parentPath}.`);
    setAddError(null);
    setIsAdding(true);
  };

  // Handle toggling expansion of topics
  const handleToggleExpand = (path, isExpanded) => {
    const newExpandedPaths = new Set(expandedPaths);
    if (isExpanded) {
      newExpandedPaths.add(path);
    } else {
      newExpandedPaths.delete(path);
    }
    setExpandedPaths(newExpandedPaths);
  };

  // Handle topic selection
  const handleTopicSelect = (numericId, pathId, topicPath) => {
    // Update the internal selected topic state
    setInternalSelectedTopicId(numericId);
    
    // Extract the topic name from the path (last part of the path)
    const parts = topicPath.split('.');
    const topicName = parts[parts.length - 1];
    
    // Call the parent component's onTopicSelect callback with both ID and name
    // This simplifies data flow and ensures proper display
    onTopicSelect && onTopicSelect(numericId, topicName);
  };

  // Process a tree node and add necessary props
  const renderTopicTree = (nodes) => {
    return nodes.map(node => {
      // For nested nodes, calculate the full path
      const fullPath = node.parent ? `${node.parent}.${node.name}` : node.name;
      
      // For comparison with selectedTopicId, we now use the numericId directly
      // since we're storing the numeric ID in preferences
      
      // Check if this node is selected
      const isSelected = node.numericId === selectedTopicId;

      return (
        <TopicTreeNode
          key={node.id || node.name}
          node={{ ...node, fullPath }}
          expandedPaths={expandedPaths}
          onToggleExpand={handleToggleExpand}
          onAddChild={handleAddChild}
          refreshTopics={refreshTopics}
          onSelect={handleTopicSelect}
          isSelected={isSelected}
        >
          {node.children && node.children.length > 0 && renderTopicTree(node.children)}
        </TopicTreeNode>
      );
    });
  };

  return (
    <div className="topics-menu">
      <div className="topics-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2>Topics</h2>
          {!isAdding && (
            <button 
              style={{
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                width: '24px',
                height: '24px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                lineHeight: 1
              }}
              onClick={() => {
                setIsAdding(true);
                setNewPath('');
              }}
              title="Add new topic"
              type="button"
            >
              +
            </button>
          )}
        </div>
        {isAdding && (
          <div className="add-topic-form-container" style={{ marginTop: '10px' }}>
            <form className="add-topic-form" onSubmit={handleAddPath}>
              <input
                type="text"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                placeholder="Enter topic path (e.g., project.feature)"
                className="add-topic-input"
                autoFocus
              />
              <div className="add-topic-actions">
                <button type="submit">Add</button>
                <button type="button" onClick={() => {
                  setIsAdding(false);
                  setNewPath('');
                  setAddError(null);
                }}>Cancel</button>
              </div>
              {addError && <div className="add-topic-error">{addError}</div>}
            </form>
          </div>
        )}
      </div>
      <nav className="topics-tree">
        {loading && <div className="topics-loading">Loading...</div>}
        {error && <div className="topics-error">{error}</div>}
        {!loading && !error && (
          <ul className="topics-list">
            {renderTopicTree(topicTree)}
          </ul>
        )}
      </nav>
    </div>
  );
};

export default TopicsMenu;
