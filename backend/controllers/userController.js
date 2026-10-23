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
  fetchMyProjects
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

// POST /api/users/update (Admin only)
async function updateUserHandler(req, res) {
  const errors = validateUpdateUser(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], errors });
  }

  const { id, ...updateData } = req.body;
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

// POST /api/users/delete (Admin only)
async function deleteUserHandler(req, res) {
  const errors = validateUserId(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], errors });
  }

  try {
    await removeUser(req.body.id);
    return res.json({ success: true, message: 'User removed successfully' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// POST /api/users/my-projects (For regular logged-in users)
async function getMyProjectsHandler(req, res) {
  const userName = req.body.userName || req.body.name || '';
  const userEmail = req.body.userEmail || req.body.email || '';
  const userUsername = req.body.username || req.body.userUsername || '';

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

module.exports = {
  listUsers,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  getMyProjectsHandler
};
