const { connectDB } = require('../db');

/**
 * System Controller — High-speed status, ping, and health telemetry
 */

async function ping(req, res) {
  return res.json({
    pong: true,
    server: 'Projectation API Engine',
    timestamp: Date.now()
  });
}

async function getHealth(req, res) {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  try {
    const pool = await connectDB();
    if (pool && pool.connected) {
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = 'error: ' + err.message;
  }
  const dbLatencyMs = Date.now() - startTime;

  return res.json({
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    uptime: Math.round(process.uptime()),
    database: {
      engine: 'Microsoft SQL Server',
      status: dbStatus,
      latencyMs: dbLatencyMs
    },
    transport: {
      encryption: 'AES/XOR-Byte64 Transport Layer',
      status: 'active'
    },
    timestamp: new Date().toISOString()
  });
}

async function getAllNamesDirectory(req, res) {
  try {
    const pool = await connectDB();
    const usersRes = await pool.request().query("SELECT id, username, name, role, email FROM Users ORDER BY name ASC");
    const membersRes = await pool.request().query("SELECT id, name, role, email, project_id FROM Members ORDER BY name ASC");
    const projectsRes = await pool.request().query("SELECT id, code, name, category, status FROM Projects ORDER BY name ASC");
    const tasksRes = await pool.request().query("SELECT id, title, assignee, status FROM Tasks ORDER BY id DESC");

    const users = usersRes.recordset || [];
    const members = membersRes.recordset || [];
    const projects = projectsRes.recordset || [];
    const tasks = tasksRes.recordset || [];

    const userNames = users.map(u => u.name);
    const memberNames = members.map(m => m.name);
    const projectNames = projects.map(p => p.name);
    const assigneeNames = Array.from(new Set(tasks.map(t => t.assignee).filter(Boolean)));

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 [API Directory Telemetry] All Names Queried by Client:');
    console.log('   👥 Registered User Names (' + userNames.length + '):', userNames.join(', '));
    console.log('   👤 Team Member Names (' + memberNames.length + '):', memberNames.join(', '));
    console.log('   📁 Project Names (' + projectNames.length + '):', projectNames.join(', '));
    console.log('   🎯 Active Assignees (' + assigneeNames.length + '):', assigneeNames.join(', '));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return res.json({
      success: true,
      counts: {
        users: userNames.length,
        members: memberNames.length,
        projects: projectNames.length,
        assignees: assigneeNames.length
      },
      names: {
        users: userNames,
        members: memberNames,
        projects: projectNames,
        assignees: assigneeNames
      },
      details: {
        users,
        members,
        projects
      }
    });
  } catch (err) {
    console.error('Failed to get names directory:', err);
    return res.status(500).json({ error: 'Failed to retrieve directory of names' });
  }
}

module.exports = {
  ping,
  getHealth,
  getAllNamesDirectory
};
