const { connectDB, sql } = require('../db');

/**
 * List live notifications for either Admin or User
 * Query params or body:
 *   role: 'Admin' | 'User'
 *   userName: 'Sarah Chen' or 'sarah'
 */
async function listNotifications(req, res) {
  try {
    const pool = await connectDB();
    const role = (req.query.role || req.body.role || 'Admin').trim();
    const userName = (req.query.userName || req.query.name || req.query.username || req.body.userName || req.body.username || '').trim().toLowerCase();

    const notifications = [];

    // 1. Fetch persistent notifications from Notifications table
    let dbNotifQuery = `
      SELECT TOP 20 
        id, 
        target_role, 
        target_user, 
        type, 
        title, 
        message, 
        priority, 
        link_id, 
        is_read, 
        created_at
      FROM Notifications
      WHERE 
    `;

    if (role.toLowerCase() === 'admin') {
      dbNotifQuery += ` target_role IN ('Admin', 'All') ORDER BY created_at DESC`;
    } else if (userName) {
      dbNotifQuery += ` (target_role IN ('User', 'All') OR (target_role = 'User' AND LOWER(ISNULL(target_user,'')) = @userName)) ORDER BY created_at DESC`;
    } else {
      dbNotifQuery += ` target_role IN ('User', 'All') ORDER BY created_at DESC`;
    }

    const notifReq = pool.request();
    if (userName) {
      notifReq.input('userName', sql.NVarChar, userName);
    }
    const dbNotifs = await notifReq.query(dbNotifQuery);

    for (const n of dbNotifs.recordset) {
      notifications.push({
        id: `db-${n.id}`,
        dbId: n.id,
        type: n.type || 'info',
        title: n.title,
        message: n.message,
        priority: n.priority || 'Medium',
        isRead: Boolean(n.is_read),
        linkId: n.link_id,
        timestamp: n.created_at ? new Date(n.created_at).toISOString() : new Date().toISOString()
      });
    }

    // 2. Dynamic Deadline Alerts
    if (role.toLowerCase() === 'admin') {
      // Top upcoming project deadlines for Admin
      const projectDeadlines = await pool.request().query(`
        SELECT TOP 3 id, name, deadline, priority 
        FROM Projects 
        WHERE status != 'Completed' AND deadline IS NOT NULL
        ORDER BY deadline ASC
      `);

      for (const proj of projectDeadlines.recordset) {
        notifications.push({
          id: `proj-deadline-${proj.id}`,
          type: 'deadline',
          title: `Project Deadline: ${proj.name}`,
          message: `Target delivery scheduled for ${proj.deadline}`,
          priority: proj.priority || 'High',
          isRead: false,
          linkId: proj.id,
          timestamp: new Date().toISOString()
        });
      }
    } else if (userName) {
      // User's own upcoming task deadlines
      const userTasks = await pool.request()
        .input('uName', sql.NVarChar, userName)
        .query(`
          SELECT TOP 3 t.id, t.title, t.due_date, t.priority, p.name AS project_name
          FROM Tasks t
          LEFT JOIN Projects p ON p.id = t.project_id
          WHERE LOWER(t.status) != 'done' 
            AND t.due_date IS NOT NULL 
            AND (LOWER(t.assignee) = @uName OR LOWER(t.assignee) LIKE '%' + @uName + '%')
          ORDER BY t.due_date ASC
        `);

      for (const task of userTasks.recordset) {
        notifications.push({
          id: `task-deadline-${task.id}`,
          type: 'deadline',
          title: `Task Due: ${task.title}`,
          message: `Deliverable in ${task.project_name || 'Project'} due by ${task.due_date}`,
          priority: task.priority || 'Medium',
          isRead: false,
          linkId: task.id,
          timestamp: new Date().toISOString()
        });
      }
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return res.json({
      total: notifications.length,
      unreadCount,
      items: notifications
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

/**
 * Mark notification(s) as read
 */
async function markNotificationRead(req, res) {
  try {
    const pool = await connectDB();
    const { id, all, role, userName } = req.body;

    if (all) {
      if (role && role.toLowerCase() === 'admin') {
        await pool.request().query("UPDATE Notifications SET is_read = 1 WHERE target_role IN ('Admin', 'All')");
      } else if (userName) {
        await pool.request()
          .input('u', sql.NVarChar, userName.toLowerCase())
          .query("UPDATE Notifications SET is_read = 1 WHERE target_role IN ('User', 'All') OR LOWER(target_user) = @u");
      } else {
        await pool.request().query("UPDATE Notifications SET is_read = 1");
      }
      return res.json({ success: true, message: 'All notifications marked as read' });
    }

    if (id) {
      const cleanId = String(id).replace('db-', '');
      const parsed = parseInt(cleanId);
      if (!isNaN(parsed)) {
        await pool.request()
          .input('id', sql.Int, parsed)
          .query("UPDATE Notifications SET is_read = 1 WHERE id = @id");
      }
      return res.json({ success: true, message: 'Notification marked as read' });
    }

    return res.status(400).json({ error: 'Notification ID or all flag is required' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}

/**
 * Clear all notifications
 */
async function clearNotifications(req, res) {
  try {
    const pool = await connectDB();
    const { role } = req.body;

    if (role && role.toLowerCase() === 'admin') {
      await pool.request().query("DELETE FROM Notifications WHERE target_role IN ('Admin', 'All')");
    } else {
      await pool.request().query("DELETE FROM Notifications");
    }

    return res.json({ success: true, message: 'Notifications cleared' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to clear notifications' });
  }
}

module.exports = {
  listNotifications,
  markNotificationRead,
  clearNotifications
};
