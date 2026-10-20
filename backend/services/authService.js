/**
 * Auth Service
 * Layer 2: Business logic — sits between validator and model
 */
const bcrypt = require('bcryptjs');
const { findUserByUsername } = require('../models/userModel');

/**
 * Verify login credentials using bcrypt comparison.
 * Supports both hashed passwords (new) and plain-text legacy passwords.
 */
async function loginUser(username, password) {
  const user = await findUserByUsername(username);

  if (!user) {
    throw new Error('Invalid login credentials!');
  }

  // Support bcrypt hashed passwords; fall back to plain-text for legacy seeds
  let passwordMatch = false;

  if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
    // Hashed password — use bcrypt to compare
    passwordMatch = await bcrypt.compare(password, user.password);
  } else {
    // Legacy plain-text — compare directly (will be upgraded on next save)
    passwordMatch = user.password === password;
  }

  if (!passwordMatch) {
    throw new Error('Invalid login credentials!');
  }

  // Return safe user object (never expose password)
  return {
    id: user.id,
    username: user.username,
    name: user.name || 'Admin',
    role: user.role
  };
}

/**
 * Hash a plain-text password with bcrypt (cost factor 12)
 */
async function hashPassword(plainText) {
  return bcrypt.hash(plainText, 12);
}

module.exports = { loginUser, hashPassword };
