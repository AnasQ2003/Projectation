/**
 * mockBackend.js — In-Browser LocalStorage Database for Netlify Live Demos & Offline Mode
 * Allows full interactive authentication, project management, sprint board updates,
 * and contributor workflows even when the Node/SQL backend is not running.
 */

const STORAGE_KEY = 'projectation_mock_db_v1';

function getInitialDB() {
  const now = new Date();
  const dateInDays = (d) => {
    const target = new Date();
    target.setDate(now.getDate() + d);
    return target.toISOString().split('T')[0];
  };

  return {
    users: [
      { id: 1, username: 'admin', name: 'Admin', role: 'Admin', email: 'admin@softwarehouse.dev' },
      { id: 2, username: 'ahmed', name: 'Ahmed', role: 'User', email: 'ahmed@softwarehouse.dev' },
      { id: 3, username: 'sarah', name: 'Sarah Chen', role: 'User', email: 'sarah.c@softwarehouse.dev' },
      { id: 4, username: 'david', name: 'David Kim', role: 'User', email: 'david.k@softwarehouse.dev' }
    ],
    categories: ['Full Stack SaaS', 'Fintech Mobile', 'Artificial Intelligence', 'Healthcare Cloud', 'Web3 & Blockchain'],
    projects: [
      {
        id: 1,
        name: 'MAD App',
        code: 'MAD-101',
        description: 'To add teen account and financial workflows with biometric security.',
        category: 'Full Stack SaaS',
        priority: 'High',
        status: 'In Progress',
        start_date: dateInDays(-15),
        deadline: dateInDays(4),
        due_date: dateInDays(4),
        budget: 75000,
        progress: 35
      },
      {
        id: 2,
        name: 'RDA Platform',
        code: 'RDA-101',
        description: 'Rapid deployment architecture with automated testing and zero-downtime rollouts.',
        category: 'Fintech Mobile',
        priority: 'High',
        status: 'In Progress',
        start_date: dateInDays(-25),
        deadline: dateInDays(25),
        due_date: dateInDays(25),
        budget: 45000,
        progress: 0
      }
    ],
    members: [
      { id: 1, project_id: 1, name: 'Ahmed', email: 'ahmed@softwarehouse.dev', role: 'Full Stack Contributor', avatar_color: '#059669' },
      { id: 2, project_id: 1, name: 'Sarah Chen', email: 'sarah.c@softwarehouse.dev', role: 'Frontend Lead', avatar_color: '#2563eb' },
      { id: 3, project_id: 1, name: 'David Kim', email: 'david.k@softwarehouse.dev', role: 'Backend Specialist', avatar_color: '#d97706' },
      { id: 4, project_id: 2, name: 'David Kim', email: 'david.k@softwarehouse.dev', role: 'Backend Specialist', avatar_color: '#d97706' }
    ],
    tasks: [
      {
        id: 101,
        project_id: 1,
        title: 'Build REST API endpoints',
        description: 'Implement auth, rate limiting, and transport payload encryption.',
        status: 'in_progress',
        priority: 'High',
        assignee: 'Ahmed',
        due_date: dateInDays(-2),
        progress_percent: 50,
        progress_note: 'Testing instant live admin notification'
      },
      {
        id: 102,
        project_id: 1,
        title: 'Frontend UI design & layout',
        description: 'Design responsive glassmorphic cards and interactive modals.',
        status: 'review',
        priority: 'Urgent',
        assignee: 'Sarah Chen',
        due_date: dateInDays(2),
        progress_percent: 75,
        progress_note: 'Waiting on QA review'
      },
      {
        id: 103,
        project_id: 1,
        title: 'For testing and fixing bugs',
        description: 'Comprehensive unit tests across service layers.',
        status: 'review',
        priority: 'Low',
        assignee: 'David Kim',
        due_date: dateInDays(5),
        progress_percent: 75,
        progress_note: 'Fixed 3 major edge cases'
      },
      {
        id: 104,
        project_id: 1,
        title: 'To work on the backend',
        description: 'Microservice data pipeline optimizations.',
        status: 'todo',
        priority: 'Medium',
        assignee: 'Ahmed',
        due_date: dateInDays(8),
        progress_percent: 0,
        progress_note: ''
      },
      {
        id: 105,
        project_id: 2,
        title: 'Backend infrastructure configuration',
        description: 'Container setup and orchestration pipeline.',
        status: 'in_progress',
        priority: 'High',
        assignee: 'David Kim',
        due_date: dateInDays(14),
        progress_percent: 50,
        progress_note: 'Terraform script testing'
      }
    ],
    notifications: [
      {
        id: 1,
        target_role: 'All',
        target_user: null,
        type: 'task_status',
        title: '🔄 Progress Update: Build REST API endpoints',
        message: 'Ahmed in MAD App: Updated task status to in_progress (50% completed)',
        priority: 'Medium',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        is_read: 0
      },
      {
        id: 2,
        target_role: 'Admin',
        target_user: null,
        type: 'task_completed',
        title: '✅ Task Completed: Database migrations',
        message: 'David Kim in RDA Platform completed deliverable successfully.',
        priority: 'High',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        is_read: 0
      }
    ],
    activity: [
      {
        id: 1,
        project_id: 1,
        action: 'Updated task "Build REST API endpoints" status to in_progress (50% completed)',
        user: 'Ahmed',
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  };
}

function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const fresh = getInitialDB();
  saveDB(fresh);
  return fresh;
}

function saveDB(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {}
}

export function handleMockRequest(endpoint, body = {}) {
  const db = loadDB();
  const cleanEndpoint = endpoint.toLowerCase().replace('/api', '');

  // 1. Authentication
  if (cleanEndpoint.includes('/auth/login')) {
    const { username = '', password = '', role = 'admin' } = body;
    const u = username.toLowerCase().trim();

    if (role === 'admin' || role === 'Admin') {
      if ((u === 'admin' || u === 'superadmin') && (password === 'admin123' || password === 'admin' || !password)) {
        return {
          token: 'mock-jwt-admin-session-token',
          user: { id: 1, username: 'admin', name: 'Admin', role: 'Admin', email: 'admin@softwarehouse.dev' }
        };
      }
      // Demo autofill support
      return {
        token: 'mock-jwt-admin-session-token',
        user: { id: 1, username: 'admin', name: 'Admin', role: 'Admin', email: 'admin@softwarehouse.dev' }
      };
    } else {
      // Contributor portal
      const found = db.users.find(usr => usr.username.toLowerCase() === u && usr.role.toLowerCase() !== 'admin') ||
                    db.users.find(usr => usr.username.toLowerCase() === 'ahmed');
      return {
        token: 'mock-jwt-contributor-session-token',
        user: found || { id: 2, username: 'ahmed', name: 'Ahmed', role: 'User', email: 'ahmed@softwarehouse.dev' }
      };
    }
  }

  // 2. Token Verify
  if (cleanEndpoint.includes('/auth/verify')) {
    return { valid: true, user: db.users[0] };
  }

  // 3. Projects List
  if (cleanEndpoint.includes('/projects/list')) {
    return db.projects.map(p => {
      const pTasks = db.tasks.filter(t => t.project_id === p.id);
      const pMembers = db.members.filter(m => m.project_id === p.id);
      const done = pTasks.filter(t => t.status === 'done').length;
      return {
        ...p,
        tasks_count: pTasks.length,
        done_tasks_count: done,
        members_count: pMembers.length,
        progress: pTasks.length > 0 ? Math.round((done / pTasks.length) * 100) : p.progress
      };
    });
  }

  // 4. Project by ID
  if (cleanEndpoint.includes('/projects/get') || cleanEndpoint.match(/\/projects\/\d+/)) {
    const id = body.id || parseInt(cleanEndpoint.split('/').pop());
    const project = db.projects.find(p => p.id === id) || db.projects[0];
    const tasks = db.tasks.filter(t => t.project_id === project.id);
    const members = db.members.filter(m => m.project_id === project.id);
    const activity = db.activity.filter(a => a.project_id === project.id);
    return { ...project, tasks, members, activity };
  }

  // 5. Create Project
  if (cleanEndpoint.includes('/projects/create')) {
    const newId = Date.now();
    const newProj = {
      id: newId,
      name: body.name || 'New Project',
      code: body.code || `PRJ-${Math.floor(100 + Math.random() * 900)}`,
      description: body.description || '',
      category: body.category || 'Full Stack SaaS',
      priority: body.priority || 'Medium',
      status: 'In Progress',
      start_date: body.kickoff_date || body.start_date || new Date().toISOString().split('T')[0],
      deadline: body.deadline || new Date().toISOString().split('T')[0],
      due_date: body.deadline || new Date().toISOString().split('T')[0],
      budget: body.budget || 50000,
      progress: 0
    };
    db.projects.push(newProj);
    saveDB(db);
    return newProj;
  }

  // 6. Update Project
  if (cleanEndpoint.includes('/projects/update')) {
    const id = body.id;
    const idx = db.projects.findIndex(p => p.id === id);
    if (idx !== -1) {
      db.projects[idx] = { ...db.projects[idx], ...body };
      saveDB(db);
      return db.projects[idx];
    }
    return { success: true };
  }

  // 7. Delete Project
  if (cleanEndpoint.includes('/projects/delete')) {
    db.projects = db.projects.filter(p => p.id !== body.id);
    db.tasks = db.tasks.filter(t => t.project_id !== body.id);
    db.members = db.members.filter(m => m.project_id !== body.id);
    saveDB(db);
    return { success: true };
  }

  // 8. Tasks List
  if (cleanEndpoint.includes('/tasks/list')) {
    return db.tasks.map(t => {
      const proj = db.projects.find(p => p.id === t.project_id) || {};
      return { ...t, project_name: proj.name, project_code: proj.code };
    });
  }

  // 9. Create Task
  if (cleanEndpoint.includes('/tasks/create')) {
    const newId = Date.now();
    const statusProgressMap = { todo: 0, in_progress: 50, review: 75, done: 100 };
    const st = (body.status || 'todo').toLowerCase();
    const newTask = {
      id: newId,
      project_id: body.project_id || db.projects[0].id,
      title: body.title || 'New Task',
      description: body.description || '',
      status: st,
      priority: body.priority || 'Medium',
      assignee: body.assignee || 'Unassigned',
      due_date: body.due_date || null,
      progress_percent: statusProgressMap[st] ?? 0,
      progress_note: ''
    };
    db.tasks.push(newTask);
    saveDB(db);
    return newTask;
  }

  // 10. Update Task Status
  if (cleanEndpoint.includes('/tasks/status')) {
    const { id, status, progress_note, completed_at, updated_by } = body;
    const task = db.tasks.find(t => t.id === id);
    if (task) {
      const statusProgressMap = { todo: 0, in_progress: 50, review: 75, done: 100 };
      const st = status.toLowerCase();
      task.status = st;
      task.progress_percent = statusProgressMap[st] ?? 0;
      if (progress_note !== undefined) task.progress_note = progress_note;
      if (completed_at !== undefined) task.completed_at = completed_at;
      if (updated_by !== undefined) task.updated_by = updated_by;
      saveDB(db);
    }
    return { success: true, updated: task };
  }

  // 11. Delete Task
  if (cleanEndpoint.includes('/tasks/delete')) {
    db.tasks = db.tasks.filter(t => t.id !== body.id);
    saveDB(db);
    return { success: true };
  }

  // 12. Members List
  if (cleanEndpoint.includes('/members/list')) {
    return db.members;
  }

  // 13. Add Member
  if (cleanEndpoint.includes('/members/add')) {
    const newMember = {
      id: Date.now(),
      project_id: body.project_id,
      name: body.name,
      role: body.role || 'Contributor',
      email: body.email || '',
      avatar_color: body.avatar_color || '#2563eb'
    };
    db.members.push(newMember);
    saveDB(db);
    return newMember;
  }

  // 14. Delete Member
  if (cleanEndpoint.includes('/members/delete')) {
    db.members = db.members.filter(m => m.id !== body.id);
    saveDB(db);
    return { success: true };
  }

  // 15. Contributor My Projects
  if (cleanEndpoint.includes('/users/my-projects')) {
    const target = (body.userName || body.username || 'ahmed').toLowerCase();
    const matchedMembers = db.members.filter(m => m.name.toLowerCase() === target || target.includes(m.name.toLowerCase()));
    const pids = matchedMembers.map(m => m.project_id);
    return db.projects.filter(p => pids.includes(p.id) || p.id === 1).map(p => {
      const myTasks = db.tasks.filter(t => t.project_id === p.id && (t.assignee.toLowerCase() === target || t.assignee.toLowerCase() === 'unassigned'));
      return {
        ...p,
        myTasks: myTasks.length > 0 ? myTasks : db.tasks.filter(t => t.project_id === p.id),
        members: db.members.filter(m => m.project_id === p.id)
      };
    });
  }

  // 16. User Progress
  if (cleanEndpoint.includes('/users/progress')) {
    return db.users.filter(u => u.role.toLowerCase() !== 'admin').map(u => {
      const uTasks = db.tasks.filter(t => t.assignee.toLowerCase() === u.name.toLowerCase());
      const done = uTasks.filter(t => t.status === 'done').length;
      const inProg = uTasks.filter(t => t.status === 'in_progress').length;
      const review = uTasks.filter(t => t.status === 'review').length;
      return {
        ...u,
        total_tasks: uTasks.length,
        done_count: done,
        in_progress_count: inProg,
        review_count: review,
        progress: uTasks.length > 0 ? Math.round((done / uTasks.length) * 100) : 0,
        tasks: uTasks
      };
    });
  }

  // 17. Users List
  if (cleanEndpoint.includes('/users/list')) {
    return db.users;
  }

  // 18. Categories List
  if (cleanEndpoint.includes('/categories/list')) {
    return db.categories;
  }

  // 19. Notifications
  if (cleanEndpoint.includes('/notifications/read')) {
    return { success: true };
  }
  if (cleanEndpoint.includes('/notifications')) {
    return db.notifications;
  }

  // 20. Analytics & Stats
  if (cleanEndpoint.includes('/stats') || cleanEndpoint.includes('/analytics')) {
    return {
      totalProjects: db.projects.length,
      totalTasks: db.tasks.length,
      completedTasks: db.tasks.filter(t => t.status === 'done').length,
      inProgressTasks: db.tasks.filter(t => t.status === 'in_progress').length,
      reviewTasks: db.tasks.filter(t => t.status === 'review').length,
      todoTasks: db.tasks.filter(t => t.status === 'todo').length,
      teamCount: db.members.length,
      projects: db.projects
    };
  }

  // 21. System Names
  if (cleanEndpoint.includes('/system/names')) {
    return {
      projects: db.projects.map(p => p.name),
      members: db.members.map(m => m.name),
      users: db.users.map(u => u.name)
    };
  }

  // Default fallback
  return { success: true, message: 'Handled in offline demo mode' };
}

