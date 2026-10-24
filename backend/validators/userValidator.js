function validateCreateUser(data) {
  const errors = [];
  if (!data.username || typeof data.username !== 'string' || data.username.trim().length < 3) {
    errors.push('Username is required and must be at least 3 characters');
  }
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Full name is required');
  }
  if (!data.password || typeof data.password !== 'string' || data.password.length < 4) {
    errors.push('Password is required and must be at least 4 characters');
  }
  if (data.role && !['Admin', 'User'].includes(data.role)) {
    errors.push('Role must be either "Admin" or "User"');
  }
  return errors;
}

function validateUpdateUser(data) {
  const errors = [];
  if (!data.id) {
    errors.push('User ID is required for update');
  }
  if (data.username !== undefined && (typeof data.username !== 'string' || data.username.trim().length < 3)) {
    errors.push('Username must be at least 3 characters');
  }
  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length === 0)) {
    errors.push('Full name cannot be empty');
  }
  if (data.password !== undefined && data.password !== '' && data.password.length < 4) {
    errors.push('New password must be at least 4 characters');
  }
  if (data.role !== undefined && !['Admin', 'User'].includes(data.role)) {
    errors.push('Role must be either "Admin" or "User"');
  }
  return errors;
}

function validateUserId(params) {
  const errors = [];
  const id = parseInt(params.id, 10);
  if (!id || isNaN(id) || id <= 0) {
    errors.push('Invalid or missing User ID');
  }
  return errors;
}

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  validateUserId
};
