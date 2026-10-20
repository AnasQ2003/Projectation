/**
 * Project Validators
 * Layer 1: Input validation — runs before service logic
 */

function validateCreateProject({ name, deadline }) {
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Project name is required');
  }

  if (!deadline || typeof deadline !== 'string' || deadline.trim().length === 0) {
    errors.push('Deadline is required');
  }

  if (name && name.trim().length > 255) {
    errors.push('Project name must not exceed 255 characters');
  }

  return errors;
}

function validateUpdateProject(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    errors.push('Request body is required');
  }

  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length === 0)) {
    errors.push('Project name must be a non-empty string');
  }

  if (body.progress !== undefined) {
    const prog = parseInt(body.progress);
    if (isNaN(prog) || prog < 0 || prog > 100) {
      errors.push('Progress must be a number between 0 and 100');
    }
  }

  return errors;
}

function validateProjectId({ id }) {
  const errors = [];
  const parsed = parseInt(id);
  if (!id || isNaN(parsed) || parsed <= 0) {
    errors.push('A valid project ID is required');
  }
  return errors;
}

module.exports = {
  validateCreateProject,
  validateUpdateProject,
  validateProjectId
};
