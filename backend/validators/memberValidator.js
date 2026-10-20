/**
 * Member Validators
 * Layer 1: Input validation — runs before service logic
 */

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
  validateMemberId
};
