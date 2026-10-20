/**
 * Auth Validators
 * Layer 1: Input validation — runs before service logic
 */

function validateLogin({ username, password }) {
  const errors = [];

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    errors.push('Username is required');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required');
  }

  if (username && username.trim().length > 100) {
    errors.push('Username must not exceed 100 characters');
  }

  return errors;
}

module.exports = { validateLogin };
