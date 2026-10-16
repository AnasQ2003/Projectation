const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'projectation.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Initialize database schema and dummy data
function initDb() {
  db.serialize(() => {
    // 1. Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Admin'
      )
    `);

    // 2. Projects Table
    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'Software',
        priority TEXT DEFAULT 'Medium',
        status TEXT DEFAULT 'In Progress',
        start_date TEXT,
        deadline TEXT NOT NULL,
        budget REAL DEFAULT 0,
        progress INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Members Table
    db.run(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        avatar_color TEXT DEFAULT '#4f46e5',
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // 4. Tasks (Working items / Jira style) Table
    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'todo',
        priority TEXT DEFAULT 'Medium',
        assignee TEXT,
        due_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // 5. Activity Logs Table
    db.run(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        user TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Seed or update admin user to Anas
    db.run("UPDATE users SET name = 'Anas' WHERE username IN ('admin', 'anas')");
    db.get('SELECT * FROM users WHERE username IN (?, ?)', ['anas', 'admin'], (err, row) => {
      if (!row) {
        db.run(
          'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
          ['anas', 'admin123', 'Anas', 'Project Lead & Admin']
        );
        console.log('Default Admin user created: anas / admin123');
      } else {
        db.run('UPDATE users SET name = ? WHERE id = ?', ['Anas', row.id]);
      }
    });

    // Check if projects exist, if not seed initial software house projects
    db.get('SELECT COUNT(*) as count FROM projects', (err, row) => {
      if (row && row.count === 0) {
        seedInitialData();
      }
    });
  });
}

function seedInitialData() {
  console.log('Seeding initial project showcase data...');

  const now = new Date();
  
  // Future dates for deadlines
  const dateInDays = (d) => {
    const target = new Date();
    target.setDate(now.getDate() + d);
    return target.toISOString().split('T')[0];
  };

  const sampleProjects = [
    {
      name: 'Apex Fintech Mobile Banking App',
      code: 'APX-BANK',
      description: 'Next-generation biometric authentication, micro-investing portfolio, and real-time wire transfers for iOS and Android.',
      category: 'Fintech Mobile',
      priority: 'High',
      status: 'In Progress',
      start_date: dateInDays(-20),
      deadline: dateInDays(2), // Urgency: Due soon (Yellow/Red indicator!)
      budget: 85000,
      progress: 68
    },
    {
      name: 'OmniAI Enterprise Copilot',
      code: 'OMNI-AI',
      description: 'Multi-agent internal workplace knowledge search, automatic PR code reviews, and meeting transcript analysis system.',
      category: 'Artificial Intelligence',
      priority: 'Urgent',
      status: 'In Progress',
      start_date: dateInDays(-45),
      deadline: dateInDays(25), // On track (Green indicator)
      budget: 140000,
      progress: 42
    },
    {
      name: 'MediCare Telehealth Video Suite',
      code: 'MEDI-CARE',
      description: 'HIPAA-compliant WebRTC encrypted consultations, electronic prescription generator, and lab results tracking.',
      category: 'Healthcare Cloud',
      priority: 'Medium',
      status: 'Planning',
      start_date: dateInDays(-5),
      deadline: dateInDays(-2), // Overdue showcase (Red indicator!)
      budget: 52000,
      progress: 20
    }
  ];

  sampleProjects.forEach((proj) => {
    db.run(
      `INSERT INTO projects (name, code, description, category, priority, status, start_date, deadline, budget, progress)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [proj.name, proj.code, proj.description, proj.category, proj.priority, proj.status, proj.start_date, proj.deadline, proj.budget, proj.progress],
      function (err) {
        if (err) return console.error('Error inserting project:', err.message);
        const projectId = this.lastID;

        // Seed Members for this project
        const members = [
          { name: 'Sarah Chen', email: 'sarah.c@softwarehouse.dev', role: 'Lead Architect', color: '#6366f1' },
          { name: 'David Kim', email: 'david.k@softwarehouse.dev', role: 'Full Stack Engineer', color: '#06b6d4' },
          { name: 'Elena Rostova', email: 'elena.r@softwarehouse.dev', role: 'UI/UX Specialist', color: '#ec4899' },
          { name: 'Marcus Vance', email: 'marcus.v@softwarehouse.dev', role: 'QA & Security Lead', color: '#10b981' }
        ];

        members.forEach(m => {
          db.run(
            `INSERT INTO members (project_id, name, email, role, avatar_color) VALUES (?, ?, ?, ?, ?)`,
            [projectId, m.name, m.email, m.role, m.color]
          );
        });

        // Seed Tasks (Jira style board)
        const tasks = [
          { title: 'Architect OAuth2 & Biometric token refresh flow', status: 'done', priority: 'High', assignee: 'Sarah Chen', due_date: dateInDays(-3) },
          { title: 'Integrate Stripe Webhooks for instant bank verification', status: 'in_progress', priority: 'Urgent', assignee: 'David Kim', due_date: dateInDays(1) },
          { title: 'Design interactive spending breakdown dashboard', status: 'review', priority: 'Medium', assignee: 'Elena Rostova', due_date: dateInDays(4) },
          { title: 'Perform end-to-end load testing on transfer endpoints', status: 'todo', priority: 'High', assignee: 'Marcus Vance', due_date: dateInDays(7) },
          { title: 'Prepare production release pipeline with Docker', status: 'todo', priority: 'Low', assignee: 'David Kim', due_date: dateInDays(12) }
        ];

        tasks.forEach(t => {
          db.run(
            `INSERT INTO tasks (project_id, title, description, status, priority, assignee, due_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [projectId, t.title, 'Implementation and peer-reviewed test coverage required.', t.status, t.priority, t.assignee, t.due_date]
          );
        });

        // Seed Activity Logs
        db.run(
          `INSERT INTO activity_logs (project_id, action, user) VALUES (?, ?, ?)`,
          [projectId, 'Project workspace initialized with core team & sprint backlog', 'Anas (Admin)']
        );
      }
    );
  });
}

module.exports = { db, initDb };
