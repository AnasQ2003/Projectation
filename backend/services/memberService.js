/**
 * Member Service
 * Layer 2: Business logic — sits between validator and model
 */
const {
  fetchAllMembers,
  insertMember,
  modifyMember,
  removeMember,
  findMemberByName,
  findMemberByEmail
} = require('../models/memberModel');

async function getAllMembers() {
  return fetchAllMembers();
}

async function addMember(data) {
  if (data.name && data.name.trim()) {
    const existingName = await findMemberByName(data.name);
    if (existingName) {
      throw new Error(`A team member with the name "${data.name.trim()}" already exists. Member names cannot be exact same; please provide a distinct name.`);
    }
  }

  if (data.email && data.email.trim()) {
    const existingEmail = await findMemberByEmail(data.email);
    if (existingEmail) {
      throw new Error(`A team member with the email "${data.email.trim()}" already exists. Member emails cannot be exact same; please provide a distinct email.`);
    }
  }

  return insertMember(data);
}

async function updateMember(id, data) {
  const memberId = parseInt(id);

  if (data.name && data.name.trim()) {
    const existingName = await findMemberByName(data.name, memberId);
    if (existingName) {
      throw new Error(`A team member with the name "${data.name.trim()}" already exists. Member names cannot be exact same; please provide a distinct name.`);
    }
  }

  if (data.email && data.email.trim()) {
    const existingEmail = await findMemberByEmail(data.email, memberId);
    if (existingEmail) {
      throw new Error(`A team member with the email "${data.email.trim()}" already exists. Member emails cannot be exact same; please provide a distinct email.`);
    }
  }

  await modifyMember(memberId, data);
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
