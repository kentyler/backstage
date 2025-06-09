import React, { useState } from 'react';
import GroupItem from './GroupItem';

/**
 * Group List Component
 * Displays a list of groups with management options and selection
 */
const GroupList = ({ groups, selectedGroupId, onGroupSelect, onUpdateGroup, onDeleteGroup, currentParticipantId }) => {
  const [editingGroupId, setEditingGroupId] = useState(null);

  const handleStartEdit = (groupId) => {
    setEditingGroupId(groupId);
  };

  const handleCancelEdit = () => {
    setEditingGroupId(null);
  };

  const handleSaveEdit = async (groupId, newName) => {
    try {
      await onUpdateGroup(groupId, newName);
      setEditingGroupId(null);
    } catch (error) {
      // Error handling is done in parent component
      console.error('Error updating group:', error);
    }
  };

  if (groups.length === 0) {
    return (
      <div className="groups-empty">
        <div className="empty-icon">🏢</div>
        <div className="empty-message">No groups yet</div>
        <div className="empty-subtitle">Create your first group to get started</div>
      </div>
    );
  }

  return (
    <div className="group-list">
      {groups.map(group => (
        <GroupItem
          key={group.id}
          group={group}
          isEditing={editingGroupId === group.id}
          isSelected={selectedGroupId === group.id}
          onSelect={onGroupSelect}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onSaveEdit={handleSaveEdit}
          onDelete={onDeleteGroup}
          currentParticipantId={currentParticipantId}
        />
      ))}
    </div>
  );
};

export default GroupList;