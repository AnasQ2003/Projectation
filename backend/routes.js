const express = require('express');
const router = express.Router();

// ── Models (all SQL queries live in /models/) ─────────────────────────────────
const { findUserByUsername }                       = require('./models/userModel');
const { fetchGlobalStats }                         = require('./models/statsModel');
const { fetchAllProjects, fetchProjectById,
        insertProject, modifyProject, removeProject } = require('./models/projectModel');
const { fetchAllMembers, insertMember, removeMember } = require('./models/memberModel');
const { fetchAllTasks, insertTask,
        modifyTask, removeTask }                   = require('./models/taskModel');

// ==========================================
// 1. HEALTH CHECK
// ==========================================
router.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'Projectation API (MSSQL)', timestamp: new Date() });
});

// ==========================================
// 2. AUTH
// ==========================================
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required' });

  try {
    const user = await findUserByUsername(username);   // → models/userModel.js
    if (!user || user.password !== password)
      return res.status(401).json({ error: 'Invalid login credentials!' });

    res.json({
      message: 'Login successful',
      token: 'admin-auth-token-secure-session',
      user: { id: user.id, username: user.username, name: user.name || 'Anas', role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. STATS  (Dashboard KPIs)
// ==========================================
router.get('/stats', async (req, res) => {
  try {
    const stats = await fetchGlobalStats();            // → models/statsModel.js
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. PROJECTS
// ==========================================

// GET  /api/projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await fetchAllProjects();         // → models/projectModel.js
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET  /api/projects/:id
router.get('/projects/:id', async (req, res) => {
  try {
    const project = await fetchProjectById(parseInt(req.params.id)); // → models/projectModel.js
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects
router.post('/projects', async (req, res) => {
  const { name, deadline } = req.body;
  if (!name || !deadline)
    return res.status(400).json({ error: 'Project Name and Deadline are required' });

  try {
    const newId = await insertProject(req.body);       // → models/projectModel.js
    res.status(201).json({ id: newId, message: 'Project created successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT  /api/projects/:id
router.put('/projects/:id', async (req, res) => {
  try {
    await modifyProject(parseInt(req.params.id), req.body); // → models/projectModel.js
    res.json({ message: 'Project updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/projects/:id', async (req, res) => {
  try {
    await removeProject(parseInt(req.params.id));      // → models/projectModel.js
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. MEMBERS
// ==========================================

// GET  /api/members
router.get('/members', async (req, res) => {
  try {
    const members = await fetchAllMembers();           // → models/memberModel.js
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/members  (project_id in body)
router.post('/members', async (req, res) => {
  const { project_id, name, email, role } = req.body;
  if (!project_id || !name || !email || !role)
    return res.status(400).json({ error: 'project_id, name, email and role are required' });

  try {
    const member = await insertMember(req.body);       // → models/memberModel.js
    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/members  (project_id in URL)
router.post('/projects/:id/members', async (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email || !role)
    return res.status(400).json({ error: 'name, email and role are required' });

  try {
    const member = await insertMember({ ...req.body, project_id: req.params.id }); // → models/memberModel.js
    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/members/:id
router.delete('/members/:id', async (req, res) => {
  try {
    await removeMember(parseInt(req.params.id));       // → models/memberModel.js
    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. TASKS
// ==========================================

// GET  /api/tasks
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await fetchAllTasks();               // → models/taskModel.js
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks  (project_id in body)
router.post('/tasks', async (req, res) => {
  const { project_id, title } = req.body;
  if (!project_id || !title)
    return res.status(400).json({ error: 'project_id and title are required' });

  try {
    const id = await insertTask(req.body);             // → models/taskModel.js
    res.status(201).json({ id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/tasks  (project_id in URL)
router.post('/projects/:id/tasks', async (req, res) => {
  const { title } = req.body;
  if (!title)
    return res.status(400).json({ error: 'Task title is required' });

  try {
    const id = await insertTask({ ...req.body, project_id: req.params.id }); // → models/taskModel.js
    res.status(201).json({ id, title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT  /api/tasks/:id
router.put('/tasks/:id', async (req, res) => {
  try {
    await modifyTask(parseInt(req.params.id), req.body); // → models/taskModel.js
    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/tasks/:id', async (req, res) => {
  try {
    await removeTask(parseInt(req.params.id));         // → models/taskModel.js
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
