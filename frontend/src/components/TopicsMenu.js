import React, { useState, useEffect } from 'react';
import { fetchTopicPaths, createTopicPath } from '../services/topics/topicsApi';
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
          id: `${path.id}_${index}`,
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
 */
const TopicsMenu = () => {
  const [topicTree, setTopicTree] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newPath, setNewPath] = useState('');
  const [addError, setAddError] = useState(null);
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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
    const paths = await fetchTopicPaths();
    const tree = buildTopicTree(paths);
    setTopicTree(tree);
  };

  const handleAddPath = async (e) => {
    e.preventDefault();
    if (!newPath.trim()) return;

    try {
      setAddError(null);
      await createTopicPath(newPath.trim());
      
      // Auto-expand all parent paths of the new path
      const pathParts = newPath.trim().split('.');
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

  return (
    <div className="topics-menu">
      <div className="topics-header">
        <h2>Topics</h2>
        {isAdding && (
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
        )}
      </div>
      <nav className="topics-tree">
        {loading && <div className="topics-loading">Loading...</div>}
        {error && <div className="topics-error">{error}</div>}
        {!loading && !error && (
          <ul className="topics-list">
            {topicTree.map((topic) => (
              <TopicTreeNode 
                key={topic.id} 
                node={topic}
                onAddChild={handleAddChild}
                expandedPaths={expandedPaths}
                onToggleExpand={(path, isExpanded) => {
                  const newExpandedPaths = new Set(expandedPaths);
                  if (isExpanded) {
                    newExpandedPaths.add(path);
                  } else {
                    newExpandedPaths.delete(path);
                  }
                  setExpandedPaths(newExpandedPaths);
                }}
                refreshTopics={refreshTopics}
              />
            ))}
          </ul>
        )}
      </nav>
    </div>
  );
};

export default TopicsMenu;
