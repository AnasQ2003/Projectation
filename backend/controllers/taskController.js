const {
  validateCreateTask,
  validateUpdateTask,
  validateTaskId
} = require('../validators/taskValidator');

const {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask
} = require('../services/taskService');

// GET /api/tasks
async function listTasks(req, res) {
  try {
    const tasks = await getAllTasks();
    return res.json(tasks);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}

// POST /api/tasks  or  POST /api/projects/:id/tasks
async function addTask(req, res) {
  const project_id = req.params.id || req.body.project_id;
  const data = { ...req.body, project_id };

  const errors = validateCreateTask(data);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], errors });
  }

  try {
    const result = await createTask(data);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create task' });
  }
}

// POST /api/tasks/update  (replaces PUT /api/tasks/:id)
async function editTask(req, res) {
  const { id: bodyId, ...updateData } = req.body;
  const id = bodyId || req.params.id;

  const idErrors = validateTaskId({ id });
  if (idErrors.length > 0) {
    return res.status(400).json({ error: idErrors[0], errors: idErrors });
  }

  const bodyErrors = validateUpdateTask(updateData);
  if (bodyErrors.length > 0) {
    return res.status(400).json({ error: bodyErrors[0], errors: bodyErrors });
  }

  try {
    const result = await updateTask(id, updateData);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update task' });
  }
}

// POST /api/tasks/status ({ id, status })
async function updateTaskStatus(req, res) {
  const { id, status } = req.body;
  if (!id || !status) {
    return res.status(400).json({ error: 'id and status are required' });
  }

  const validStatuses = ['todo', 'in_progress', 'review', 'done'];
  if (!validStatuses.includes(status.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid status value. Must be todo, in_progress, review, or done.' });
  }

  try {
    const result = await updateTask(id, { status: status.toLowerCase() });
    return res.json({ success: true, updated: result });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update task status' });
  }
}

// POST /api/tasks/delete  (replaces DELETE /api/tasks/:id)
async function removeTaskHandler(req, res) {
  const id = req.body.id || req.params.id;

  const idErrors = validateTaskId({ id });
  if (idErrors.length > 0) {
    return res.status(400).json({ error: idErrors[0], errors: idErrors });
  }

  try {
    const result = await deleteTask(id);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete task' });
  }
}

module.exports = {
  listTasks,
  addTask,
  editTask,
  updateTaskStatus,
  removeTaskHandler
};
