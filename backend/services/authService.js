/**
 * Auth Service
 * Layer 2: Business logic — sits between validator and model
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { findUserByUsername } = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
}

/**
 * Verify login credentials using bcrypt comparison.
 * Returns a signed JWT on success — never returns the raw user password.
 */
async function loginUser(username, password) {
  const user = await findUserByUsername(username);

  if (!user) {
    // Use a constant-time comparison equivalent message to avoid user enumeration
    throw new Error('Invalid login credentials!');
  }

  // Only accept bcrypt-hashed passwords — no plaintext fallback
  const isHashed =
    user.password.startsWith('$2a$') || user.password.startsWith('$2b$');

  if (!isHashed) {
    // Password in DB is not hashed — block login and force a re-hash on next admin reset
    throw new Error('Invalid login credentials!');
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new Error('Invalid login credentials!');
  }

  // Build safe user payload (never include password)
  const safeUser = {
    id: user.id,
    username: user.username,
    name: user.name || 'Admin',
    role: user.role
  };

  // Sign a real JWT with expiry
  const token = jwt.sign(safeUser, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return { user: safeUser, token };
}

/**
 * Hash a plain-text password with bcrypt (cost factor 12)
 */
async function hashPassword(plainText) {
  return bcrypt.hash(plainText, 12);
}

module.exports = { loginUser, hashPassword };
