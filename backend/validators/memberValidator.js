

function validateCreateMember({ project_id, name, email, role }) {
  const errors = [];

  if (!project_id || isNaN(parseInt(project_id))) {
    errors.push('A valid project_id is required');
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Member name is required');
  }

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('Member email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!role || typeof role !== 'string' || role.trim().length === 0) {
    errors.push('Member role is required');
  }

  return errors;
}

function validateUpdateMember(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    errors.push('Request body is required');
    return errors;
  }
  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length === 0)) {
    errors.push('Member name must be a non-empty string');
  }
  if (body.email !== undefined && (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()))) {
    errors.push('A valid email address is required');
  }
  return errors;
}

function validateMemberId({ id }) {
  const errors = [];
  const parsed = parseInt(id);
  if (!id || isNaN(parsed) || parsed <= 0) {
    errors.push('A valid member ID is required');
  }
  return errors;
}

module.exports = {
  validateCreateMember,
  validateUpdateMember,
  validateMemberId
};
