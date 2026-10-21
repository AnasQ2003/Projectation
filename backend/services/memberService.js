/**
 * Member Service
 * Layer 2: Business logic — sits between validator and model
 */
const {
  fetchAllMembers,
  insertMember,
  modifyMember,
  removeMember
} = require('../models/memberModel');

async function getAllMembers() {
  return fetchAllMembers();
}

async function addMember(data) {
  return insertMember(data);
}

async function updateMember(id, data) {
  await modifyMember(parseInt(id), data);
  return { message: 'Member updated successfully' };
}

async function deleteMember(id) {
  await removeMember(parseInt(id));
  return { message: 'Member removed successfully' };
}

module.exports = {
  getAllMembers,
  addMember,
  updateMember,
  deleteMember
};
