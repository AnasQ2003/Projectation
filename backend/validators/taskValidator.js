

function validateCreateTask({ project_id, title }) {
  const errors = [];

  if (!project_id || isNaN(parseInt(project_id))) {
    errors.push('A valid project_id is required');
  }

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Task title is required');
  }

  if (title && title.trim().length > 255) {
    errors.push('Task title must not exceed 255 characters');
  }

  return errors;
}

function validateUpdateTask(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    errors.push('Request body is required');
    return errors;
  }

  const allowedStatuses = ['todo', 'in_progress', 'review', 'done'];
  if (body.status !== undefined && !allowedStatuses.includes(body.status)) {
    errors.push(`Status must be one of: ${allowedStatuses.join(', ')}`);
  }

  const allowedPriorities = ['Low', 'Medium', 'High', 'Urgent'];
  if (body.priority !== undefined && !allowedPriorities.includes(body.priority)) {
    errors.push(`Priority must be one of: ${allowedPriorities.join(', ')}`);
  }

  return errors;
}

function validateTaskId({ id }) {
  const errors = [];
  const parsed = parseInt(id);
  if (!id || isNaN(parsed) || parsed <= 0) {
    errors.push('A valid task ID is required');
  }
  return errors;
}

module.exports = {
  validateCreateTask,
  validateUpdateTask,
  validateTaskId
};
