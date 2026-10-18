const express = require('express');
const cors = require('cors');
const { connectDB, executeQuery, sql } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ensure SQL Server is connected on boot
connectDB().catch(err => {
  console.error('Failed to initialize SQL Server on startup:', err.message);
});

// -----------------------------
// Authentication Route (Admin only)
// -----------------------------
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const cleanUser = username.trim().toLowerCase();
    const result = await executeQuery(
      `SELECT * FROM Users WHERE LOWER(username) = @u OR (LOWER(username) = 'anas' AND @u = 'admin') OR (LOWER(username) = 'admin' AND @u = 'anas')`,
      { u: cleanUser }
    );

    const user = result.recordset[0];
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid login credentials!' });
    }

    res.json({
      message: 'Login successful',
      token: 'admin-auth-token-secure-session',
      user: {
        id: user.id,
        username: user.username,
        name: user.name || 'Anas',
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// Global Dashboard Stats
// -----------------------------
app.get('/api/stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM Projects) AS total_projects,
        (SELECT COUNT(*) FROM Tasks WHERE status != 'done') AS active_tasks,
        (SELECT COUNT(*) FROM Tasks WHERE status = 'done') AS completed_tasks,
        (SELECT COUNT(*) FROM Members) AS total_members
    `;
    const result = await executeQuery(query);
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// Projects CRUD Routes
// -----------------------------

// 1. Get All Projects (with member & task counts)
app.get('/api/projects', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.*,
        COUNT(DISTINCT m.id) AS member_count,
        COUNT(DISTINCT t.id) AS total_tasks,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS done_tasks
      FROM Projects p
      LEFT JOIN Members m ON m.project_id = p.id
      LEFT JOIN Tasks t ON t.project_id = p.id
      GROUP BY p.id, p.name, p.code, p.description, p.category, p.priority, p.status, p.start_date, p.deadline, p.budget, p.progress, p.created_at
      ORDER BY p.id DESC
    `;

    const result = await executeQuery(query);
    const projects = result.recordset.map(p => {
      let calcProgress = p.progress;
      if (p.total_tasks > 0) {
        calcProgress = Math.round(((p.done_tasks || 0) / p.total_tasks) * 100);
      }
      return {
        ...p,
        calculated_progress: calcProgress
      };
    });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Single Project Details
app.get('/api/projects/:id', async (req, res) => {
  const projectId = parseInt(req.params.id);

  try {
    const projResult = await executeQuery('SELECT * FROM Projects WHERE id = @id', { id: projectId });
    const project = projResult.recordset[0];
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const [membersRes, tasksRes, logsRes] = await Promise.all([
      executeQuery('SELECT * FROM Members WHERE project_id = @id ORDER BY id ASC', { id: projectId }),
      executeQuery('SELECT * FROM Tasks WHERE project_id = @id ORDER BY id DESC', { id: projectId }),
      executeQuery('SELECT TOP 15 * FROM ActivityLogs WHERE project_id = @id ORDER BY id DESC', { id: projectId })
    ]);

    res.json({
      ...project,
      members: membersRes.recordset || [],
      tasks: tasksRes.recordset || [],
      activity_logs: logsRes.recordset || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create New Project
app.post('/api/projects', async (req, res) => {
  const { name, code, description, category, priority, status, start_date, deadline, budget } = req.body;

  if (!name || !deadline) {
    return res.status(400).json({ error: 'Project Name and Deadline are required' });
  }

  const generatedCode = code ? code.toUpperCase() : name.slice(0, 4).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
  const startDateVal = start_date || new Date().toISOString().split('T')[0];

  try {
    const query = `
      INSERT INTO Projects (name, code, description, category, priority, status, start_date, deadline, budget, progress)
      OUTPUT INSERTED.id
      VALUES (@name, @code, @description, @category, @priority, @status, @start_date, @deadline, @budget, 0);
    `;

    const insRes = await executeQuery(query, {
      name,
      code: generatedCode,
      description: description || '',
      category: category || 'Software Development',
      priority: priority || 'Medium',
      status: status || 'In Progress',
      start_date: startDateVal,
      deadline,
      budget: parseFloat(budget) || 0
    });

    const newProjectId = insRes.recordset[0].id;

    // Add activity log
    await executeQuery(
      `INSERT INTO ActivityLogs (project_id, action, [user]) VALUES (@pid, @action, @user)`,
      {
        pid: newProjectId,
        action: `Project created with deadline ${deadline}`,
        user: 'Anas (Admin)'
      }
    );

    res.status(201).json({
      id: newProjectId,
      message: 'Project created successfully!'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Update Project Details
app.put('/api/projects/:id', async (req, res) => {
  const projectId = parseInt(req.params.id);
  const { name, code, description, category, priority, status, start_date, deadline, budget, progress } = req.body;

  try {
    const query = `
      UPDATE Projects 
      SET name = COALESCE(@name, name),
          code = COALESCE(@code, code),
          description = COALESCE(@description, description),
          category = COALESCE(@category, category),
          priority = COALESCE(@priority, priority),
          status = COALESCE(@status, status),
          start_date = COALESCE(@start_date, start_date),
          deadline = COALESCE(@deadline, deadline),
          budget = COALESCE(@budget, budget),
          progress = COALESCE(@progress, progress)
      WHERE id = @id;
    `;

    await executeQuery(query, {
      name: name !== undefined ? name : null,
      code: code !== undefined ? code : null,
      description: description !== undefined ? description : null,
      category: category !== undefined ? category : null,
      priority: priority !== undefined ? priority : null,
      status: status !== undefined ? status : null,
      start_date: start_date !== undefined ? start_date : null,
      deadline: deadline !== undefined ? deadline : null,
      budget: budget !== undefined ? parseFloat(budget) : null,
      progress: progress !== undefined ? parseInt(progress) : null,
      id: projectId
    });

    await executeQuery(
      `INSERT INTO ActivityLogs (project_id, action, [user]) VALUES (@pid, 'Project details updated', 'Anas (Admin)')`,
      { pid: projectId }
    );

    res.json({ message: 'Project updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Delete Project
app.delete('/api/projects/:id', async (req, res) => {
  const projectId = parseInt(req.params.id);
  try {
    await executeQuery('DELETE FROM Projects WHERE id = @id', { id: projectId });
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// Members Routes
// -----------------------------

// Get All Members with detailed work completion metrics across projects
app.get('/api/members', async (req, res) => {
  try {
    const query = `
      SELECT 
        m.id,
        m.project_id,
        m.name,
        m.email,
        m.role,
        m.avatar_color,
        p.name AS project_name,
        p.code AS project_code,
        ISNULL((SELECT COUNT(*) FROM Tasks t WHERE t.project_id = m.project_id AND t.assignee = m.name), 0) AS tasks_assigned,
        ISNULL((SELECT COUNT(*) FROM Tasks t WHERE t.project_id = m.project_id AND t.assignee = m.name AND t.status = 'done'), 0) AS tasks_completed,
        ISNULL((SELECT COUNT(*) FROM Tasks t WHERE t.project_id = m.project_id AND t.assignee = m.name AND t.status != 'done'), 0) AS tasks_pending
      FROM Members m
      LEFT JOIN Projects p ON p.id = m.project_id
      ORDER BY m.id DESC
    `;
    const result = await executeQuery(query);

    // Also fetch tasks assigned to each member for work details
    const tasksRes = await executeQuery('SELECT * FROM Tasks ORDER BY id DESC');
    const allTasks = tasksRes.recordset || [];

    const membersWithWork = result.recordset.map(m => {
      const memberTasks = allTasks.filter(t => t.project_id === m.project_id && t.assignee === m.name);
      const total = m.tasks_assigned;
      const done = m.tasks_completed;
      const rate = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        ...m,
        completion_rate: rate,
        tasks: memberTasks
      };
    });

    res.json(membersWithWork);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add member with project_id in body
app.post('/api/members', async (req, res) => {
  const { project_id, name, email, role, avatar_color } = req.body;
  if (!project_id || !name || !email || !role) {
    return res.status(400).json({ error: 'Project, Name, email, and role are required' });
  }

  const colors = ['#2563eb', '#0891b2', '#db2777', '#16a34a', '#d97706', '#7c3aed'];
  const assignedColor = avatar_color || colors[Math.floor(Math.random() * colors.length)];

  try {
    const query = `
      INSERT INTO Members (project_id, name, email, role, avatar_color)
      OUTPUT INSERTED.id
      VALUES (@pid, @name, @email, @role, @color);
    `;
    const insRes = await executeQuery(query, {
      pid: parseInt(project_id),
      name,
      email,
      role,
      color: assignedColor
    });

    await executeQuery(
      `INSERT INTO ActivityLogs (project_id, action, [user]) VALUES (@pid, @action, 'Anas (Admin)')`,
      {
        pid: parseInt(project_id),
        action: `Added team member: ${name} (${role})`
      }
    );

    res.status(201).json({ id: insRes.recordset[0].id, project_id, name, email, role, avatar_color: assignedColor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects/:id/members', async (req, res) => {
  const projectId = parseInt(req.params.id);
  const { name, email, role, avatar_color } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  const colors = ['#2563eb', '#0891b2', '#db2777', '#16a34a', '#d97706', '#7c3aed'];
  const assignedColor = avatar_color || colors[Math.floor(Math.random() * colors.length)];

  try {
    const query = `
      INSERT INTO Members (project_id, name, email, role, avatar_color)
      OUTPUT INSERTED.id
      VALUES (@pid, @name, @email, @role, @color);
    `;
    const insRes = await executeQuery(query, {
      pid: projectId,
      name,
      email,
      role,
      color: assignedColor
    });

    await executeQuery(
      `INSERT INTO ActivityLogs (project_id, action, [user]) VALUES (@pid, @action, 'Anas (Admin)')`,
      {
        pid: projectId,
        action: `Added team member: ${name} (${role})`
      }
    );

    res.status(201).json({ id: insRes.recordset[0].id, name, email, role, avatar_color: assignedColor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  const memberId = parseInt(req.params.id);
  try {
    await executeQuery('DELETE FROM Members WHERE id = @id', { id: memberId });
    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// Tasks (Working / Sprint) Routes
// -----------------------------

// Get All Tasks across projects with project metadata
app.get('/api/tasks', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.*,
        p.name AS project_name,
        p.code AS project_code
      FROM Tasks t
      LEFT JOIN Projects p ON p.id = t.project_id
      ORDER BY t.id DESC
    `;
    const result = await executeQuery(query);
    res.json(result.recordset || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create task with project_id in body
app.post('/api/tasks', async (req, res) => {
  const { project_id, title, description, status, priority, assignee, due_date } = req.body;
  if (!project_id || !title) {
    return res.status(400).json({ error: 'Project and Task title are required' });
  }

  try {
    const query = `
      INSERT INTO Tasks (project_id, title, description, status, priority, assignee, due_date)
      OUTPUT INSERTED.id
      VALUES (@pid, @title, @desc, @status, @priority, @assignee, @due_date);
    `;

    const insRes = await executeQuery(query, {
      pid: parseInt(project_id),
      title,
      desc: description || '',
      status: status || 'todo',
      priority: priority || 'Medium',
      assignee: assignee || 'Unassigned',
      due_date: due_date || null
    });

    await executeQuery(
      `INSERT INTO ActivityLogs (project_id, action, [user]) VALUES (@pid, @action, 'Anas (Admin)')`,
      {
        pid: parseInt(project_id),
        action: `Created task: "${title}"`
      }
    );

    res.status(201).json({ id: insRes.recordset[0].id, project_id, title, status, priority });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects/:id/tasks', async (req, res) => {
  const projectId = parseInt(req.params.id);
  const { title, description, status, priority, assignee, due_date } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  try {
    const query = `
      INSERT INTO Tasks (project_id, title, description, status, priority, assignee, due_date)
      OUTPUT INSERTED.id
      VALUES (@pid, @title, @desc, @status, @priority, @assignee, @due_date);
    `;

    const insRes = await executeQuery(query, {
      pid: projectId,
      title,
      desc: description || '',
      status: status || 'todo',
      priority: priority || 'Medium',
      assignee: assignee || 'Unassigned',
      due_date: due_date || null
    });

    await executeQuery(
      `INSERT INTO ActivityLogs (project_id, action, [user]) VALUES (@pid, @action, 'Anas (Admin)')`,
      {
        pid: projectId,
        action: `Created task: "${title}"`
      }
    );

    res.status(201).json({ id: insRes.recordset[0].id, title, status, priority });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id);
  const { title, description, status, priority, assignee, due_date } = req.body;

  try {
    const query = `
      UPDATE Tasks
      SET title = COALESCE(@title, title),
          description = COALESCE(@description, description),
          status = COALESCE(@status, status),
          priority = COALESCE(@priority, priority),
          assignee = COALESCE(@assignee, assignee),
          due_date = COALESCE(@due_date, due_date)
      WHERE id = @id;
    `;

    await executeQuery(query, {
      title: title !== undefined ? title : null,
      description: description !== undefined ? description : null,
      status: status !== undefined ? status : null,
      priority: priority !== undefined ? priority : null,
      assignee: assignee !== undefined ? assignee : null,
      due_date: due_date !== undefined ? due_date : null,
      id: taskId
    });

    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id);
  try {
    await executeQuery('DELETE FROM Tasks WHERE id = @id', { id: taskId });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'Projectation API (MSSQL)', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Projectation Backend server running on http://localhost:${PORT} (Connected to MS SQL Server)`);
});
