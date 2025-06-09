import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/auth/authContext';
import { getGroups, createGroup, updateGroup, deleteGroup } from '../../services/groups/groupsApi';
import CreateGroupForm from './CreateGroupForm';
import GroupList from './GroupList';
import './GroupsColumn.css';

/**
 * Groups Column Component
 * Shows groups for the authenticated user's client
 * Allows creating, editing, and deleting groups
 * Only shows when authenticated
 */
const GroupsColumn = () => {
  const { isAuthenticated, clientId, participantId } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load groups when component mounts or auth changes
  useEffect(() => {
    if (isAuthenticated && clientId) {
      loadGroups();
    }
  }, [isAuthenticated, clientId]);

  const loadGroups = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🏢 GROUPS: Loading groups for client', { clientId });
      const groupsData = await getGroups();
      setGroups(groupsData);
      console.log('🏢 GROUPS: Groups loaded successfully', { count: groupsData.length });
    } catch (err) {
      console.error('🏢 GROUPS: Error loading groups:', err);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (groupName) => {
    try {
      console.log('🏢 GROUPS: Creating group', { groupName, clientId });
      const newGroup = await createGroup(groupName);
      setGroups(prev => [...prev, newGroup]);
      setShowCreateForm(false);
      console.log('🏢 GROUPS: Group created successfully', newGroup);
    } catch (err) {
      console.error('🏢 GROUPS: Error creating group:', err);
      throw err; // Let the form handle the error display
    }
  };

  const handleUpdateGroup = async (groupId, newName) => {
    try {
      console.log('🏢 GROUPS: Updating group', { groupId, newName, clientId });
      const updatedGroup = await updateGroup(groupId, newName);
      setGroups(prev => prev.map(group => 
        group.id === groupId ? updatedGroup : group
      ));
      console.log('🏢 GROUPS: Group updated successfully', updatedGroup);
    } catch (err) {
      console.error('🏢 GROUPS: Error updating group:', err);
      setError('Failed to update group');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('🏢 GROUPS: Deleting group', { groupId, clientId });
      await deleteGroup(groupId);
      setGroups(prev => prev.filter(group => group.id !== groupId));
      console.log('🏢 GROUPS: Group deleted successfully', { groupId });
    } catch (err) {
      console.error('🏢 GROUPS: Error deleting group:', err);
      setError('Failed to delete group');
    }
  };

  if (!isAuthenticated) {
    return null; // Don't show groups column when not authenticated
  }

  return (
    <div className="groups-column">
      <div className="groups-header">
        <h3>🏢 Groups</h3>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="create-group-toggle"
          disabled={loading}
        >
          {showCreateForm ? '✕' : '+'}
        </button>
      </div>

      {error && (
        <div className="groups-error">
          {error}
          <button onClick={() => setError('')} className="error-dismiss">✕</button>
        </div>
      )}

      {showCreateForm && (
        <CreateGroupForm 
          onCreateGroup={handleCreateGroup}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <div className="groups-content">
        {loading ? (
          <div className="groups-loading">Loading groups...</div>
        ) : (
          <GroupList 
            groups={groups}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
            currentParticipantId={participantId}
          />
        )}
      </div>

      <div className="groups-status">
        <div className="status-item">
          📥 Receiving client_id: <strong>{clientId}</strong>
        </div>
        <div className="status-item">
          👥 Groups count: <strong>{groups.length}</strong>
        </div>
      </div>
    </div>
  );
};

export default GroupsColumn;