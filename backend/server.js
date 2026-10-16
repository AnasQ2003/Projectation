const express = require('express');
const cors = require('cors');
const { db, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize SQLite DB
initDb();

// -----------------------------
// Authentication Route (Admin only)
// -----------------------------
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const cleanUser = username.trim().toLowerCase();
  db.get('SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(username) = ?', [cleanUser, cleanUser === 'anas' ? 'admin' : 'anas'], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid admin credentials! (Use anas or admin / admin123)' });
    }

    // Return token & Anas admin profile
    res.json({
      message: 'Login successful',
      token: 'admin-auth-token-secure-session',
      user: {
        id: user.id,
        username: user.username,
        name: 'Anas',
        role: 'Project Lead & Admin'
      }
    });
  });
});

// -----------------------------
// Global Dashboard Stats
// -----------------------------
app.get('/api/stats', (req, res) => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM projects) as total_projects,
      (SELECT COUNT(*) FROM tasks WHERE status != 'done') as active_tasks,
      (SELECT COUNT(*) FROM tasks WHERE status = 'done') as completed_tasks,
      (SELECT COUNT(*) FROM members) as total_members
  `;
  db.get(query, [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

// -----------------------------
// Projects CRUD Routes
// -----------------------------

// 1. Get All Projects (with member & task summaries)
app.get('/api/projects', (req, res) => {
  const query = `
    SELECT 
      p.*,
      COUNT(DISTINCT m.id) as member_count,
      COUNT(DISTINCT t.id) as total_tasks,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_tasks
    FROM projects p
    LEFT JOIN members m ON m.project_id = p.id
    LEFT JOIN tasks t ON t.project_id = p.id
    GROUP BY p.id
    ORDER BY p.id DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Calculate accurate completion progress percentage
    const projects = rows.map(p => {
      let calcProgress = p.progress;
      if (p.total_tasks > 0) {
        calcProgress = Math.round((p.done_tasks / p.total_tasks) * 100);
      }
      return {
        ...p,
        calculated_progress: calcProgress
      };
    });

    res.json(projects);
  });
});

// 2. Get Single Project Details (Full workspace: members, tasks, activity)
app.get('/api/projects/:id', (req, res) => {
  const projectId = req.params.id;

  db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err, project) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Fetch members
    db.all('SELECT * FROM members WHERE project_id = ? ORDER BY id ASC', [projectId], (err, members) => {
      if (err) return res.status(500).json({ error: err.message });

      // Fetch tasks
      db.all('SELECT * FROM tasks WHERE project_id = ? ORDER BY id DESC', [projectId], (err, tasks) => {
        if (err) return res.status(500).json({ error: err.message });

        // Fetch activity logs
        db.all('SELECT * FROM activity_logs WHERE project_id = ? ORDER BY id DESC LIMIT 15', [projectId], (err, logs) => {
          if (err) return res.status(500).json({ error: err.message });

          res.json({
            ...project,
            members: members || [],
            tasks: tasks || [],
            activity_logs: logs || []
          });
        });
      });
    });
  });
});

// 3. Create New Project
app.post('/api/projects', (req, res) => {
  const { name, code, description, category, priority, status, start_date, deadline, budget } = req.body;

  if (!name || !deadline) {
    return res.status(400).json({ error: 'Project Name and Deadline are required' });
  }

  const generatedCode = code ? code.toUpperCase() : name.slice(0, 4).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
  const startDateVal = start_date || new Date().toISOString().split('T')[0];

  const query = `
    INSERT INTO projects (name, code, description, category, priority, status, start_date, deadline, budget, progress)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [
      name,
      generatedCode,
      description || '',
      category || 'Software Development',
      priority || 'Medium',
      status || 'In Progress',
      startDateVal,
      deadline,
      budget || 0,
      0
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const newProjectId = this.lastID;

      // Add default activity log
      db.run(
        'INSERT INTO activity_logs (project_id, action, user) VALUES (?, ?, ?)',
        [newProjectId, `Project created with deadline ${deadline}`, 'Anas (Admin)']
      );

      res.status(201).json({
        id: newProjectId,
        message: 'Project created successfully!'
      });
    }
  );
});

// 4. Update Project Details
app.put('/api/projects/:id', (req, res) => {
  const projectId = req.params.id;
  const { name, code, description, category, priority, status, start_date, deadline, budget, progress } = req.body;

  const query = `
    UPDATE projects 
    SET name = COALESCE(?, name),
        code = COALESCE(?, code),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        priority = COALESCE(?, priority),
        status = COALESCE(?, status),
        start_date = COALESCE(?, start_date),
        deadline = COALESCE(?, deadline),
        budget = COALESCE(?, budget),
        progress = COALESCE(?, progress)
    WHERE id = ?
  `;

  db.run(
    query,
    [name, code, description, category, priority, status, start_date, deadline, budget, progress, projectId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      
      db.run(
        'INSERT INTO activity_logs (project_id, action, user) VALUES (?, ?, ?)',
        [projectId, 'Project information updated', 'Admin']
      );

      res.json({ message: 'Project updated successfully' });
    }
  );
});

// 5. Delete Project
app.delete('/api/projects/:id', (req, res) => {
  const projectId = req.params.id;

  db.run('DELETE FROM projects WHERE id = ?', [projectId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Project and all associated data deleted successfully' });
  });
});

// -----------------------------
// Members Routes
// -----------------------------

// Add Member to Project
app.post('/api/projects/:id/members', (req, res) => {
  const projectId = req.params.id;
  const { name, email, role, avatar_color } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  const colors = ['#6366f1', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];
  const assignedColor = avatar_color || colors[Math.floor(Math.random() * colors.length)];

  const query = `INSERT INTO members (project_id, name, email, role, avatar_color) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [projectId, name, email, role, assignedColor], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    db.run(
      'INSERT INTO activity_logs (project_id, action, user) VALUES (?, ?, ?)',
      [projectId, `Added team member: ${name} (${role})`, 'Admin']
    );

    res.status(201).json({ id: this.lastID, name, email, role, avatar_color: assignedColor });
  });
});

// Delete Member
app.delete('/api/members/:id', (req, res) => {
  const memberId = req.params.id;
  db.run('DELETE FROM members WHERE id = ?', [memberId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Member removed successfully' });
  });
});

// -----------------------------
// Tasks (Working / Jira items) Routes
// -----------------------------

// Add Task to Project
app.post('/api/projects/:id/tasks', (req, res) => {
  const projectId = req.params.id;
  const { title, description, status, priority, assignee, due_date } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const query = `
    INSERT INTO tasks (project_id, title, description, status, priority, assignee, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [projectId, title, description || '', status || 'todo', priority || 'Medium', assignee || 'Unassigned', due_date || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      db.run(
        'INSERT INTO activity_logs (project_id, action, user) VALUES (?, ?, ?)',
        [projectId, `Created task: "${title}"`, 'Admin']
      );

      res.status(201).json({ id: this.lastID, title, status, priority });
    }
  );
});

// Update Task (status, priority, assignee, etc.)
app.put('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  const { title, description, status, priority, assignee, due_date } = req.body;

  const query = `
    UPDATE tasks
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        assignee = COALESCE(?, assignee),
        due_date = COALESCE(?, due_date)
    WHERE id = ?
  `;

  db.run(query, [title, description, status, priority, assignee, due_date, taskId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Task updated successfully' });
  });
});

// Delete Task
app.delete('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  db.run('DELETE FROM tasks WHERE id = ?', [taskId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Task deleted successfully' });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'Projectation API', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Projectation Backend server running on http://localhost:${PORT}`);
});
