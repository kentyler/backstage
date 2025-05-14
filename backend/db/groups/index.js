/**
 * Groups database module
 * 
 * Export all group-related database functions
 */

const getAllGroups = require('./getAllGroups');
const getGroupById = require('./getGroupById');

module.exports = {
  getAllGroups,
  getGroupById
  // Add other group functions as they are created
};
