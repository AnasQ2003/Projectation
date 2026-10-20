/**
 * Member Service
 * Layer 2: Business logic — sits between validator and model
 */
const {
  fetchAllMembers,
  insertMember,
  removeMember
} = require('../models/memberModel');

async function getAllMembers() {
  return fetchAllMembers();
}

async function addMember(data) {
  return insertMember(data);
}

async function deleteMember(id) {
  await removeMember(parseInt(id));
  return { message: 'Member removed successfully' };
}

module.exports = {
  getAllMembers,
  addMember,
  deleteMember
};
