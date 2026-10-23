const bcrypt = require('bcryptjs');
const {
  getAllUsers,
  findUserById,
  findUserByUsername,
  createUser,
  updateUser,
  deleteUser,
  getUserAssignedProjects
} = require('../models/userModel');

/**
 * User Service (Layer 2 — Business Logic)
 * Sits between Controller and Model
 */

async function listAllUsers() {
  return getAllUsers();
}

async function getUserDetails(id) {
  const user = await findUserById(id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

async function createNewUser(userData) {
  // Check if username already exists
  const existing = await findUserByUsername(userData.username);
  if (existing) {
    throw new Error('Username already exists. Please choose a different username.');
  }

  // Hash password using bcrypt (cost factor 12)
  const hashedPassword = await bcrypt.hash(userData.password, 12);

  const newUser = await createUser({
    username: userData.username,
    password: hashedPassword,
    name: userData.name,
    role: userData.role || 'User',
    email: userData.email
  });

  return newUser;
}

async function modifyUser(id, updateData) {
  const user = await findUserById(id);
  if (!user) {
    throw new Error('User not found');
  }

  // If changing username, check collision
  if (updateData.username && updateData.username.toLowerCase() !== user.username.toLowerCase()) {
    const existing = await findUserByUsername(updateData.username);
    if (existing) {
      throw new Error('Username already exists. Please choose a different username.');
    }
  }

  const payload = { ...updateData };

  // Hash password if updating password
  if (payload.password && payload.password.trim() !== '') {
    payload.password = await bcrypt.hash(payload.password, 12);
  } else {
    delete payload.password;
  }

  const updated = await updateUser(id, payload);
  return updated;
}

async function removeUser(id) {
  const user = await findUserById(id);
  if (!user) {
    throw new Error('User not found');
  }
  if (user.role === 'Admin') {
    throw new Error('Cannot delete primary Administrator account');
  }
  return deleteUser(id);
}

async function fetchMyProjects(userName, userEmail, userUsername) {
  return getUserAssignedProjects(userName, userEmail, userUsername);
}

module.exports = {
  listAllUsers,
  getUserDetails,
  createNewUser,
  modifyUser,
  removeUser,
  fetchMyProjects
};
