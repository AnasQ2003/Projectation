const { connectDB } = require('../db');

async function listNotifications(req, res) {
  try {
    const pool = await connectDB();
    const notifications = [];

    // 1. Projects with approaching deadlines
    const projectDeadlines = await pool.request().query(`
      SELECT TOP 5 id, name, deadline, priority 
      FROM Projects 
      WHERE status != 'Completed' AND deadline IS NOT NULL
      ORDER BY deadline ASC
    `);

    for (const proj of projectDeadlines.recordset) {
      notifications.push({
        id: `proj-deadline-${proj.id}`,
        type: 'deadline',
        title: `Project Milestone Deadline`,
        message: `${proj.name} deadline set for ${proj.deadline}`,
        priority: proj.priority,
        timestamp: new Date().toISOString()
      });
    }

    // 2. Urgent / High priority uncompleted tasks
    const urgentTasks = await pool.request().query(`
      SELECT TOP 5 t.id, t.title, t.priority, t.due_date, p.name AS project_name
      FROM Tasks t
      LEFT JOIN Projects p ON t.project_id = p.id
      WHERE t.status != 'done' AND t.priority IN ('Urgent', 'High')
      ORDER BY t.created_at DESC
    `);

    for (const task of urgentTasks.recordset) {
      notifications.push({
        id: `task-urgent-${task.id}`,
        type: 'task',
        title: `${task.priority} Priority Task`,
        message: `"${task.title}" in ${task.project_name || 'Project'} requires review`,
        priority: task.priority,
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      total: notifications.length,
      unreadCount: notifications.length,
      items: notifications
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

module.exports = {
  listNotifications
};
