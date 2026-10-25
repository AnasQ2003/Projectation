const sql = require('mssql');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME || 'ProjectationDB',
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 25,
    min: 2,
    idleTimeoutMillis: 3600000,
    acquireTimeoutMillis: 15000
  }
};

// Fail fast if critical env vars are missing
if (!dbConfig.user || !dbConfig.password || !dbConfig.server) {
  throw new Error(
    'FATAL: DB_USER, DB_PASSWORD, and DB_HOST must be set in .env. Refusing to start.'
  );
}

let pool = null;
let poolConnecting = null;
let schemaReady = false;
let schemaInitPromise = null;

async function ensureDatabaseExists() {
  const masterConfig = {
    ...dbConfig,
    database: 'master'
  };

  try {
    const masterPool = await sql.connect(masterConfig);
    await masterPool.request().query(`
      IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ProjectationDB')
      BEGIN
        CREATE DATABASE ProjectationDB;
      END
    `);
    await masterPool.close();
    console.log('✅ SQL Server: ProjectationDB verified/created in SSMS!');
  } catch (err) {
    console.error('⚠️ Warning checking master database:', err.message);
  }
}

async function connectDB() {
  if (pool && pool.connected && schemaReady) return pool;
  if (poolConnecting) return poolConnecting;

  poolConnecting = (async () => {
    try {
      // Connect directly to target database for instant startup (<50ms)
      pool = await sql.connect(dbConfig);
      console.log(`🔌 Connected to Microsoft SQL Server (${dbConfig.database}) [Pool Ready]`);

      pool.on('error', err => {
        console.error('⚠️ SQL Pool connection event:', err.message);
        pool = null;
        schemaReady = false;
      });

      // Run table verification and seeding — AWAIT it so schema is guaranteed before first request
      schemaInitPromise = initSchemaAndSeed();
      await schemaInitPromise;
      schemaReady = true;

      return pool;
    } catch (err) {
      // If DB does not exist yet, create it from master and connect
      if (err.message && (err.message.includes('Cannot open database') || err.message.includes('ProjectationDB'))) {
        console.log('Database ProjectationDB not detected. Creating database via master...');
        await ensureDatabaseExists();
        pool = await sql.connect(dbConfig);
        await initSchemaAndSeed();
        schemaReady = true;
        return pool;
      }
      console.error('❌ SQL Server connection error:', err.message);
      throw err;
    } finally {
      poolConnecting = null;
    }
  })();

  return poolConnecting;
}

async function initSchemaAndSeed() {
  try {
    const req = pool.request();

    // 1. Users Table
    await req.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
      BEGIN
        CREATE TABLE Users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          username NVARCHAR(100) UNIQUE NOT NULL,
          password NVARCHAR(255) NOT NULL,
          name NVARCHAR(100) NOT NULL,
          role NVARCHAR(100) NOT NULL DEFAULT 'Admin'
        );
      END
    `);

    // 2. Projects Table
    await req.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Projects')
      BEGIN
        CREATE TABLE Projects (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          code NVARCHAR(50) NOT NULL,
          description NVARCHAR(MAX),
          category NVARCHAR(100) DEFAULT 'Software Development',
          priority NVARCHAR(50) DEFAULT 'Medium',
          status NVARCHAR(50) DEFAULT 'In Progress',
          start_date NVARCHAR(50),
          deadline NVARCHAR(50) NOT NULL,
          budget FLOAT DEFAULT 0,
          progress INT DEFAULT 0,
          created_at DATETIME DEFAULT GETDATE()
        );
      END
    `);

    // 3. Members Table
    await req.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Members')
      BEGIN
        CREATE TABLE Members (
          id INT IDENTITY(1,1) PRIMARY KEY,
          project_id INT NOT NULL FOREIGN KEY REFERENCES Projects(id) ON DELETE CASCADE,
          name NVARCHAR(100) NOT NULL,
          email NVARCHAR(150) NOT NULL,
          role NVARCHAR(100) NOT NULL,
          avatar_color NVARCHAR(50) DEFAULT '#2563eb'
        );
      END
    `);

    // 4. Tasks Table
    await req.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tasks')
      BEGIN
        CREATE TABLE Tasks (
          id INT IDENTITY(1,1) PRIMARY KEY,
          project_id INT NOT NULL FOREIGN KEY REFERENCES Projects(id) ON DELETE CASCADE,
          title NVARCHAR(255) NOT NULL,
          description NVARCHAR(MAX),
          status NVARCHAR(50) DEFAULT 'todo',
          priority NVARCHAR(50) DEFAULT 'Medium',
          assignee NVARCHAR(100),
          due_date NVARCHAR(50),
          created_at DATETIME DEFAULT GETDATE()
        );
      END
    `);

    // 5. ActivityLogs Table
    await req.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ActivityLogs')
      BEGIN
        CREATE TABLE ActivityLogs (
          id INT IDENTITY(1,1) PRIMARY KEY,
          project_id INT NOT NULL FOREIGN KEY REFERENCES Projects(id) ON DELETE CASCADE,
          action NVARCHAR(MAX) NOT NULL,
          [user] NVARCHAR(100) NOT NULL,
          created_at DATETIME DEFAULT GETDATE()
        );
      END
    `);

    // Ensure email column exists on Users table
    await req.query(`
      IF COL_LENGTH('Users', 'email') IS NULL
      BEGIN
        ALTER TABLE Users ADD email NVARCHAR(150);
      END
    `);

    // Ensure Tasks table has completed_at, progress_percent, progress_note, updated_by columns
    await req.query(`
      IF COL_LENGTH('Tasks', 'completed_at') IS NULL
      BEGIN
        ALTER TABLE Tasks ADD completed_at NVARCHAR(50);
      END
      IF COL_LENGTH('Tasks', 'progress_percent') IS NULL
      BEGIN
        ALTER TABLE Tasks ADD progress_percent INT DEFAULT 0;
      END
      IF COL_LENGTH('Tasks', 'progress_note') IS NULL
      BEGIN
        ALTER TABLE Tasks ADD progress_note NVARCHAR(MAX);
      END
      IF COL_LENGTH('Tasks', 'updated_by') IS NULL
      BEGIN
        ALTER TABLE Tasks ADD updated_by NVARCHAR(100);
      END
    `);

    // 6. Notifications Table
    await req.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
      BEGIN
        CREATE TABLE Notifications (
          id INT IDENTITY(1,1) PRIMARY KEY,
          target_role NVARCHAR(50) DEFAULT 'All',
          target_user NVARCHAR(100) NULL,
          type NVARCHAR(50) NOT NULL,
          title NVARCHAR(255) NOT NULL,
          message NVARCHAR(MAX) NOT NULL,
          priority NVARCHAR(50) DEFAULT 'Medium',
          link_id INT NULL,
          is_read BIT DEFAULT 0,
          created_at DATETIME DEFAULT GETDATE()
        );
      END
    `);

    // Backfill completed_at for existing done tasks if missing
    await req.query(`
      UPDATE Tasks
      SET completed_at = due_date,
          progress_percent = 100
      WHERE LOWER(status) = 'done' AND (completed_at IS NULL OR completed_at = '');
    `);

    // Seed initial notifications if Notifications table is empty
    const notifCheck = await pool.request().query("SELECT COUNT(*) AS count FROM Notifications");
    if (notifCheck.recordset[0].count === 0) {
      await pool.request().query(`
        INSERT INTO Notifications (target_role, target_user, type, title, message, priority, is_read, created_at)
        VALUES 
        ('Admin', NULL, 'task_completed', 'Task Completed On Time', 'Sarah Chen completed "Architect OAuth2 & Biometric token refresh flow" ahead of schedule', 'High', 0, DATEADD(hour, -2, GETDATE())),
        ('Admin', NULL, 'task_status', 'Task Progress Updated', 'David Kim updated "Integrate payment webhooks" to In Progress (65% completed)', 'Medium', 0, DATEADD(hour, -4, GETDATE())),
        ('User', 'sarah', 'assignment', 'Sprint Milestone Active', 'Your tasks in "Apex Fintech Mobile Banking App" are currently on track for sprint review', 'Medium', 0, DATEADD(hour, -1, GETDATE())),
        ('User', 'david', 'deadline', 'Upcoming Task Deadline', 'Task "Integrate payment webhooks" due tomorrow', 'High', 0, DATEADD(hour, -3, GETDATE())),
        ('All', NULL, 'info', 'Workspace System Active', 'Real-time task tracking and progress reporting enabled across all project dashboards', 'Low', 0, DATEADD(hour, -5, GETDATE()));
      `);
    }

    // Ensure only ONE primary Administrator account exists: username 'admin', name 'Admin'
    await pool.request().query("DELETE FROM Users WHERE LOWER(username) = 'anas'");
    const adminCheck = await pool.request().query("SELECT * FROM Users WHERE LOWER(username) = 'admin'");
    if (adminCheck.recordset.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await pool.request()
        .input('hash', sql.NVarChar, hashedPassword)
        .query(`
          INSERT INTO Users (username, password, name, role, email)
          VALUES ('admin', @hash, 'Admin', 'Admin', 'admin@softwarehouse.dev');
        `);
      console.log('✅ Single Admin user initialized with encrypted credentials');
    } else {
      await pool.request().query(`
        UPDATE Users 
        SET name = 'Admin', role = 'Admin', email = 'admin@softwarehouse.dev' 
        WHERE LOWER(username) = 'admin';
      `);
    }

    // Ensure exactly the 3 registered users exist (Ahmed, Sarah Chen, David Kim)
    const userCheck = await pool.request().query("SELECT username FROM Users WHERE username IN ('ahmed', 'sarah', 'david')");
    const existingUsernames = userCheck.recordset.map(u => u.username.toLowerCase());
    const regularPasswordHash = await bcrypt.hash('user123', 12);

    const initialRegularUsers = [
      { username: 'ahmed', name: 'Ahmed', role: 'User', email: 'a@softwarehouse.dev' },
      { username: 'sarah', name: 'Sarah Chen', role: 'User', email: 'sarah.c@softwarehouse.dev' },
      { username: 'david', name: 'David Kim', role: 'User', email: 'david.k@softwarehouse.dev' }
    ];

    for (const ru of initialRegularUsers) {
      if (!existingUsernames.includes(ru.username)) {
        await pool.request()
          .input('u', sql.NVarChar, ru.username)
          .input('p', sql.NVarChar, regularPasswordHash)
          .input('n', sql.NVarChar, ru.name)
          .input('r', sql.NVarChar, ru.role)
          .input('e', sql.NVarChar, ru.email)
          .query(`
            INSERT INTO Users (username, password, name, role, email)
            VALUES (@u, @p, @n, @r, @e)
          `);
        console.log(`✅ Seeded regular user: ${ru.username}`);
      }
    }

    // Ensure Sarah and David are in Members table for assigned projects
    const memberCheck = await pool.request().query("SELECT name FROM Members WHERE name IN ('Sarah Chen', 'David Kim')");
    const existingMembers = memberCheck.recordset.map(m => m.name);
    const firstProj = await pool.request().query("SELECT TOP 1 id FROM Projects ORDER BY id ASC");
    if (firstProj.recordset.length > 0) {
      const pId = firstProj.recordset[0].id;
      if (!existingMembers.includes('Sarah Chen')) {
        await pool.request()
          .input('pid', sql.Int, pId)
          .input('name', sql.NVarChar, 'Sarah Chen')
          .input('email', sql.NVarChar, 'sarah.c@softwarehouse.dev')
          .input('role', sql.NVarChar, 'Frontend Specialist')
          .input('color', sql.NVarChar, '#3b82f6')
          .query("INSERT INTO Members (project_id, name, email, role, avatar_color) VALUES (@pid, @name, @email, @role, @color)");
      }
      if (!existingMembers.includes('David Kim')) {
        await pool.request()
          .input('pid', sql.Int, pId)
          .input('name', sql.NVarChar, 'David Kim')
          .input('email', sql.NVarChar, 'david.k@softwarehouse.dev')
          .input('role', sql.NVarChar, 'Backend Specialist')
          .input('color', sql.NVarChar, '#10b981')
          .query("INSERT INTO Members (project_id, name, email, role, avatar_color) VALUES (@pid, @name, @email, @role, @color)");
      }
    }

    // Automatic data hygiene: Remove any orphaned members that do not match active registered users
    await pool.request().query(`
      DELETE FROM Members 
      WHERE LOWER(LTRIM(RTRIM(email))) NOT IN (SELECT LOWER(LTRIM(RTRIM(email))) FROM Users WHERE LOWER(role) != 'admin') 
        AND LOWER(LTRIM(RTRIM(name))) NOT IN (SELECT LOWER(LTRIM(RTRIM(name))) FROM Users WHERE LOWER(role) != 'admin') 
        AND LOWER(LTRIM(RTRIM(name))) NOT IN (SELECT LOWER(LTRIM(RTRIM(username))) FROM Users WHERE LOWER(role) != 'admin');
    `);

    // Seed sample projects if empty
    const projCheck = await pool.request().query("SELECT COUNT(*) AS count FROM Projects");
    if (projCheck.recordset[0].count === 0) {
      await seedInitialProjects();
    }
  } catch (err) {
    console.error('Error during SQL Server schema initialization:', err.message);
  }
}

async function seedInitialProjects() {
  console.log('🌱 Seeding initial project data in SQL Server...');
  const now = new Date();
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
      deadline: dateInDays(2),
      budget: 8500000,
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
      deadline: dateInDays(25),
      budget: 14000000,
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
      deadline: dateInDays(-2),
      budget: 5200000,
      progress: 20
    }
  ];

  for (const proj of sampleProjects) {
    const insRes = await pool.request()
      .input('name', sql.NVarChar, proj.name)
      .input('code', sql.NVarChar, proj.code)
      .input('description', sql.NVarChar, proj.description)
      .input('category', sql.NVarChar, proj.category)
      .input('priority', sql.NVarChar, proj.priority)
      .input('status', sql.NVarChar, proj.status)
      .input('start_date', sql.NVarChar, proj.start_date)
      .input('deadline', sql.NVarChar, proj.deadline)
      .input('budget', sql.Float, proj.budget)
      .input('progress', sql.Int, proj.progress)
      .query(`
        INSERT INTO Projects (name, code, description, category, priority, status, start_date, deadline, budget, progress)
        OUTPUT INSERTED.id
        VALUES (@name, @code, @description, @category, @priority, @status, @start_date, @deadline, @budget, @progress)
      `);

    const newId = insRes.recordset[0].id;

    // Seed Members
    const members = [
      { name: 'Sarah Chen', email: 'sarah.c@softwarehouse.dev', role: 'Lead Architect', color: '#2563eb' },
      { name: 'David Kim', email: 'david.k@softwarehouse.dev', role: 'Full Stack Engineer', color: '#0891b2' },
      { name: 'Elena Rostova', email: 'elena.r@softwarehouse.dev', role: 'UI/UX Specialist', color: '#db2777' },
      { name: 'Marcus Vance', email: 'marcus.v@softwarehouse.dev', role: 'QA & Security Lead', color: '#16a34a' }
    ];

    for (const m of members) {
      await pool.request()
        .input('pid', sql.Int, newId)
        .input('name', sql.NVarChar, m.name)
        .input('email', sql.NVarChar, m.email)
        .input('role', sql.NVarChar, m.role)
        .input('color', sql.NVarChar, m.color)
        .query(`
          INSERT INTO Members (project_id, name, email, role, avatar_color)
          VALUES (@pid, @name, @email, @role, @color)
        `);
    }

    // Seed Tasks
    const tasks = [
      { title: 'Architect OAuth2 & Biometric token refresh flow', status: 'done', priority: 'High', assignee: 'Sarah Chen', due_date: dateInDays(-3) },
      { title: 'Integrate payment webhooks for instant bank verification', status: 'in_progress', priority: 'Urgent', assignee: 'David Kim', due_date: dateInDays(1) },
      { title: 'Design interactive spending breakdown dashboard', status: 'review', priority: 'Medium', assignee: 'Elena Rostova', due_date: dateInDays(4) },
      { title: 'Perform end-to-end load testing on transfer endpoints', status: 'todo', priority: 'High', assignee: 'Marcus Vance', due_date: dateInDays(7) }
    ];

    for (const t of tasks) {
      await pool.request()
        .input('pid', sql.Int, newId)
        .input('title', sql.NVarChar, t.title)
        .input('desc', sql.NVarChar, 'Implementation and peer-reviewed test coverage required.')
        .input('status', sql.NVarChar, t.status)
        .input('priority', sql.NVarChar, t.priority)
        .input('assignee', sql.NVarChar, t.assignee)
        .input('due_date', sql.NVarChar, t.due_date)
        .query(`
          INSERT INTO Tasks (project_id, title, description, status, priority, assignee, due_date)
          VALUES (@pid, @title, @desc, @status, @priority, @assignee, @due_date)
        `);
    }

    // Seed Activity Log
    await pool.request()
      .input('pid', sql.Int, newId)
      .input('action', sql.NVarChar, 'Project workspace initialized with core team & sprint backlog')
      .input('user', sql.NVarChar, 'Admin')
      .query(`
        INSERT INTO ActivityLogs (project_id, action, [user])
        VALUES (@pid, @action, @user)
      `);
  }

  console.log('✅ Finished seeding initial projects in SQL Server');
}

const executeQuery = async (query, params = {}) => {
  const activePool = await connectDB();
  const request = activePool.request();

  Object.keys(params).forEach(key => {
    const val = params[key];
    request.input(key, val === undefined ? null : val);
  });

  const result = await request.query(query);
  return result;
};

module.exports = {
  connectDB,
  executeQuery,
  sql
};
