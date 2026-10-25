const {
  validateCreateUser,
  validateUpdateUser,
  validateUserId
} = require('../validators/userValidator');

const {
  listAllUsers,
  createNewUser,
  modifyUser,
  removeUser,
  fetchMyProjects,
  fetchUsersProgress
} = require('../services/userService');

/**
 * User Controller (Layer 3)
 * Orchestrates validator and service, responds to client
 */

// POST /api/users/list (Admin only)
async function listUsers(req, res) {
  try {
    const users = await listAllUsers();
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch registered users' });
  }
}

// POST /api/users/create (Admin only)
async function createUserHandler(req, res) {
  const errors = validateCreateUser(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], errors });
  }

  try {
    const newUser = await createNewUser(req.body);
    return res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// PUT /api/users/:id or POST /api/users/update
async function updateUserHandler(req, res) {
  const urlId = (req.path || req.url || '').split('/').filter(Boolean).pop();
  const id = req.params?.id || req.body?.id || (urlId && urlId !== 'update' ? urlId : undefined);
  const { id: _, ...updateData } = req.body;
  const errors = validateUpdateUser({ id, ...updateData });
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], errors });
  }

  try {
    const updated = await modifyUser(id, updateData);
    return res.json({
      message: 'User updated successfully',
      user: updated
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// DELETE /api/users/:id or POST /api/users/delete
async function deleteUserHandler(req, res) {
  const urlId = (req.path || req.url || '').split('/').filter(Boolean).pop();
  const id = req.params?.id || req.body?.id || (urlId && urlId !== 'delete' ? urlId : undefined);
  const errors = validateUserId({ id });
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], errors });
  }

  try {
    await removeUser(id);
    return res.json({ success: true, message: 'User removed successfully' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// POST /api/users/my-projects (For regular logged-in users)
async function getMyProjectsHandler(req, res) {
  const userName = req.query.userName || req.query.name || req.body?.userName || req.body?.name || '';
  const userEmail = req.query.userEmail || req.query.email || req.body?.userEmail || req.body?.email || '';
  const userUsername = req.query.username || req.query.userUsername || req.body?.username || req.body?.userUsername || '';

  if (!userName && !userEmail && !userUsername) {
    return res.status(400).json({ error: 'User identifier is required' });
  }

  try {
    const projects = await fetchMyProjects(userName, userEmail, userUsername);
    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch assigned projects' });
  }
}

// GET /api/users/progress (For Admin to view all users' task progress & deadline delivery)
async function getUsersProgressHandler(req, res) {
  try {
    const progressList = await fetchUsersProgress();
    return res.json(progressList);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user progress summary' });
  }
}

module.exports = {
  listUsers,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  getMyProjectsHandler,
  getUsersProgressHandler
};
