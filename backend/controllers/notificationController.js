const { connectDB, sql } = require('../db');

// In-memory store for read dynamic notification IDs and mark-all timestamps
const dynamicReadIds = new Set();
const dynamicAllReadTimestamps = {};

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
    const userName = (req.query.userName || req.query.name || req.body.userName || req.body.name || '').trim().toLowerCase();
    const userEmail = (req.query.userEmail || req.query.email || req.body.userEmail || req.body.email || '').trim().toLowerCase();
    const userUsername = (req.query.userUsername || req.query.username || req.body.userUsername || req.body.username || '').trim().toLowerCase();

    const notifications = [];

    // 1. Fetch persistent notifications from Notifications table
    let dbNotifQuery = `
      SELECT TOP 30 
        id, 
        target_role, 
        target_user, 
        type, 
        title, 
        message, 
        priority, 
        link_id, 
        is_read, 
        created_at,
        DATEDIFF(second, created_at, GETDATE()) AS age_seconds
      FROM Notifications
      WHERE 
    `;

    const notifReq = pool.request();

    if (role.toLowerCase() === 'admin') {
      dbNotifQuery += ` target_role IN ('Admin', 'All') ORDER BY created_at DESC`;
    } else {
      // User: only show notifications broadcast to 'All', or notifications explicitly targeting this user
      const userIdentifiers = [userName, userEmail, userUsername].filter(Boolean);
      if (userIdentifiers.length > 0) {
        notifReq.input('uName', sql.NVarChar, userName || '___none___');
        notifReq.input('uEmail', sql.NVarChar, userEmail || '___none___');
        notifReq.input('uUsername', sql.NVarChar, userUsername || '___none___');
        dbNotifQuery += ` (
          target_role = 'All' 
          OR (
            target_role = 'User' 
            AND (
              target_user IS NULL 
              OR LTRIM(RTRIM(target_user)) = '' 
              OR LOWER(LTRIM(RTRIM(target_user))) IN (@uName, @uEmail, @uUsername)
            )
          )
        ) ORDER BY created_at DESC`;
      } else {
        dbNotifQuery += ` (target_role = 'All' OR (target_role = 'User' AND (target_user IS NULL OR LTRIM(RTRIM(target_user)) = ''))) ORDER BY created_at DESC`;
      }
    }

    const dbNotifs = await notifReq.query(dbNotifQuery);

    for (const n of dbNotifs.recordset) {
      const ageSec = typeof n.age_seconds === 'number' && !isNaN(n.age_seconds) ? Math.max(0, n.age_seconds) : 0;
      const accurateTimestamp = new Date(Date.now() - (ageSec * 1000)).toISOString();

      notifications.push({
        id: `db-${n.id}`,
        dbId: n.id,
        type: n.type || 'info',
        title: n.title,
        message: n.message,
        priority: n.priority || 'Medium',
        isRead: Boolean(n.is_read),
        linkId: n.link_id,
        timestamp: accurateTimestamp
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
        const notifId = `proj-deadline-${proj.id}`;
        const isRead = dynamicReadIds.has(notifId) || dynamicReadIds.has(`admin_${notifId}`) || Boolean(dynamicAllReadTimestamps['admin']);
        // Use a derived stable timestamp: 1 hour before the deadline so it always shows a real relative time
        const deadlineDate = new Date(proj.deadline);
        const stableTimestamp = isNaN(deadlineDate.getTime())
          ? new Date(Date.now() - 3600000).toISOString()
          : new Date(deadlineDate.getTime() - 3600000).toISOString();
        notifications.push({
          id: notifId,
          type: 'deadline',
          title: `Project Deadline: ${proj.name}`,
          message: `Target delivery scheduled for ${proj.deadline}`,
          priority: proj.priority || 'High',
          isRead,
          linkId: proj.id,
          timestamp: stableTimestamp
        });
      }
    } else if (userName || userEmail || userUsername) {
      // User's own upcoming task deadlines
      const userTasks = await pool.request()
        .input('uName', sql.NVarChar, userName || '___none___')
        .input('uEmail', sql.NVarChar, userEmail || '___none___')
        .input('uUsername', sql.NVarChar, userUsername || '___none___')
        .query(`
          SELECT TOP 3 t.id, t.title, t.due_date, t.priority, p.name AS project_name
          FROM Tasks t
          LEFT JOIN Projects p ON p.id = t.project_id
          WHERE LOWER(t.status) != 'done' 
            AND t.due_date IS NOT NULL 
            AND (
              LOWER(t.assignee) = @uName 
              OR LOWER(t.assignee) = @uEmail 
              OR LOWER(t.assignee) = @uUsername
              OR (@uName != '___none___' AND LEN(@uName) > 2 AND LOWER(t.assignee) LIKE '%' + @uName + '%')
            )
          ORDER BY t.due_date ASC
        `);

      for (const task of userTasks.recordset) {
        const notifId = `task-deadline-${task.id}`;
        const isRead = dynamicReadIds.has(notifId) || dynamicReadIds.has(`${userName}_${notifId}`) || Boolean(dynamicAllReadTimestamps[userName]);
        // Stable timestamp: 2 hours before task due date
        const dueDate = new Date(task.due_date);
        const stableTimestamp = isNaN(dueDate.getTime())
          ? new Date(Date.now() - 7200000).toISOString()
          : new Date(dueDate.getTime() - 7200000).toISOString();
        notifications.push({
          id: notifId,
          type: 'deadline',
          title: `Task Due: ${task.title}`,
          message: `Deliverable in ${task.project_name || 'Project'} due by ${task.due_date}`,
          priority: task.priority || 'Medium',
          isRead,
          linkId: task.id,
          timestamp: stableTimestamp
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
    const { id, all, role, userName, userEmail, userUsername } = req.body;

    if (all) {
      if (role && role.toLowerCase() === 'admin') {
        dynamicAllReadTimestamps['admin'] = Date.now();
        await pool.request().query("UPDATE Notifications SET is_read = 1 WHERE target_role IN ('Admin', 'All')");
      } else {
        const u = (userName || '').toLowerCase();
        const e = (userEmail || '').toLowerCase();
        const un = (userUsername || '').toLowerCase();
        if (u) dynamicAllReadTimestamps[u] = Date.now();
        if (un) dynamicAllReadTimestamps[un] = Date.now();

        await pool.request()
          .input('u', sql.NVarChar, u || '___none___')
          .input('e', sql.NVarChar, e || '___none___')
          .input('un', sql.NVarChar, un || '___none___')
          .query(`
            UPDATE Notifications 
            SET is_read = 1 
            WHERE target_role = 'All' 
               OR (target_role = 'User' AND (target_user IS NULL OR LOWER(target_user) IN (@u, @e, @un)))
          `);
      }
      return res.json({ success: true, message: 'All notifications marked as read' });
    }

    if (id) {
      const idStr = String(id);
      if (idStr.startsWith('proj-deadline-') || idStr.startsWith('task-deadline-')) {
        dynamicReadIds.add(idStr);
        if (userName) dynamicReadIds.add(`${userName.toLowerCase()}_${idStr}`);
        if (role && role.toLowerCase() === 'admin') dynamicReadIds.add(`admin_${idStr}`);
        return res.json({ success: true, message: 'Notification marked as read' });
      }

      const cleanId = idStr.replace('db-', '');
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
