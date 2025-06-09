// src/db/groups/index.js
// Barrel file: re-export all group CRUD operations

export { createGroup } from './createGroup.js';
export { getAllGroups } from './getAllGroups.js';
export { getGroupById } from './getGroupById.js';
export { getGroupByName } from './getGroupByName.js';
export { updateGroup } from './updateGroup.js';
export { deleteGroup } from './deleteGroup.js';
export { getGroupsByParticipant } from './getGroupsByParticipant.js';
export { addParticipantToGroup } from './addParticipantToGroup.js';
export { removeParticipantFromGroup } from './removeParticipantFromGroup.js';
export { getParticipantsByGroup } from './getParticipantsByGroup.js';

