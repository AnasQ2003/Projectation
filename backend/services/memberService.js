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
  findMemberByEmail,
  findMemberInProject
} = require('../models/memberModel');
const {
  findUserByEmail,
  findUserByName,
  findUserByUsername
} = require('../models/userModel');

async function getAllMembers() {
  return fetchAllMembers();
}

async function addMember(data) {
  const cleanEmail = (data.email || '').trim().toLowerCase();
  const cleanName = (data.name || '').trim();

  // 1. Mandatory registration check: Member MUST be a registered user in the system
  let registeredUser = null;
  if (cleanEmail) {
    registeredUser = await findUserByEmail(cleanEmail);
  }
  if (!registeredUser && cleanName) {
    registeredUser = (await findUserByName(cleanName)) || (await findUserByUsername(cleanName));
  }

  if (!registeredUser) {
    const identifier = cleanName || cleanEmail || 'This user';
    throw new Error(`"${identifier}" is not registered. Please register the user in User Management first before assigning them to a project.`);
  }

  // Use the verified registered user's canonical name & email
  data.name = registeredUser.name || registeredUser.username;
  data.email = registeredUser.email;

  // 2. Prevent duplicate assignment of the same user to the same project
  if (data.project_id) {
    const existingInProject = await findMemberInProject(data.project_id, data.name, data.email);
    if (existingInProject) {
      throw new Error(`"${data.name}" is already assigned as a team member in this project.`);
    }
  }

  return insertMember(data);
}

async function updateMember(id, data) {
  const memberId = parseInt(id);
  const cleanEmail = (data.email || '').trim().toLowerCase();
  const cleanName = (data.name || '').trim();

  // If changing name or email, verify against registered users
  if (cleanEmail || cleanName) {
    let registeredUser = null;
    if (cleanEmail) {
      registeredUser = await findUserByEmail(cleanEmail);
    }
    if (!registeredUser && cleanName) {
      registeredUser = (await findUserByName(cleanName)) || (await findUserByUsername(cleanName));
    }

    if (!registeredUser) {
      const identifier = cleanName || cleanEmail || 'This user';
      throw new Error(`"${identifier}" is not registered. Please register the user in User Management first.`);
    }

    data.name = registeredUser.name || registeredUser.username;
    data.email = registeredUser.email;

    if (data.project_id) {
      const existingInProject = await findMemberInProject(data.project_id, data.name, data.email, memberId);
      if (existingInProject) {
        throw new Error(`"${data.name}" is already assigned to this project.`);
      }
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

