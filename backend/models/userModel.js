const { executeQuery, connectDB, sql } = require('../db');

/**
 * User Model (Layer 4 — Data Access & SQL Queries)
 * Talks directly to Microsoft SQL Server via db.js
 */

/**
 * Find user by username
 */
async function findUserByUsername(username, excludeId = null) {
  const cleanUser = (username || '').trim().toLowerCase();
  if (!cleanUser) return null;
  const query = excludeId
    ? `SELECT * FROM Users WHERE LOWER(LTRIM(RTRIM(username))) = @u AND id != @excludeId`
    : `SELECT * FROM Users WHERE LOWER(LTRIM(RTRIM(username))) = @u`;
  const result = await executeQuery(query, { u: cleanUser, excludeId });
  return result.recordset[0] || null;
}

/**
 * Find user by exact name (case-insensitive)
 */
async function findUserByName(name, excludeId = null) {
  const cleanName = (name || '').trim().toLowerCase();
  if (!cleanName) return null;
  const query = excludeId 
    ? `SELECT * FROM Users WHERE LOWER(LTRIM(RTRIM(name))) = @n AND id != @excludeId`
    : `SELECT * FROM Users WHERE LOWER(LTRIM(RTRIM(name))) = @n`;
  const result = await executeQuery(query, { n: cleanName, excludeId });
  return result.recordset[0] || null;
}

/**
 * Find user by exact email (case-insensitive)
 */
async function findUserByEmail(email, excludeId = null) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return null;
  const query = excludeId
    ? `SELECT * FROM Users WHERE LOWER(LTRIM(RTRIM(email))) = @e AND id != @excludeId`
    : `SELECT * FROM Users WHERE LOWER(LTRIM(RTRIM(email))) = @e`;
  const result = await executeQuery(query, { e: cleanEmail, excludeId });
  return result.recordset[0] || null;
}

/**
 * Find user by ID
 */
async function findUserById(id) {
  const result = await executeQuery(
    `SELECT id, username, name, role, email FROM Users WHERE id = @id`,
    { id }
  );
  return result.recordset[0] || null;
}

/**
 * List all users (for Admin management)
 */
async function getAllUsers() {
  const result = await executeQuery(
    `SELECT id, username, name, role, email FROM Users ORDER BY id ASC`
  );
  return result.recordset;
}

/**
 * Insert a new user (Admin only)
 */
async function createUser({ username, password, name, role, email }) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('u', sql.NVarChar, username.trim().toLowerCase())
    .input('p', sql.NVarChar, password)
    .input('n', sql.NVarChar, name.trim())
    .input('r', sql.NVarChar, role || 'User')
    .input('e', sql.NVarChar, email || `${username.trim().toLowerCase()}@softwarehouse.dev`)
    .query(`
      INSERT INTO Users (username, password, name, role, email)
      OUTPUT INSERTED.id, INSERTED.username, INSERTED.name, INSERTED.role, INSERTED.email
      VALUES (@u, @p, @n, @r, @e)
    `);

  const createdUser = result.recordset[0];

  // Notify admin about user creation
  try {
    await executeQuery(
      `INSERT INTO Notifications (target_role, target_user, type, title, message, priority, link_id, is_read)
       VALUES ('Admin', NULL, 'info', @title, @msg, 'Medium', NULL, 0)`,
      {
        title: `👤 User Created: ${createdUser.name}`,
        msg: `You created account "${createdUser.name}" (@${createdUser.username}, ${createdUser.role}).`
      }
    );
  } catch (notifErr) {
    console.error('Warning: Could not create admin user creation notification:', notifErr.message);
  }

  return createdUser;
}

/**
 * Update an existing user (Admin only)
 */
async function updateUser(id, { username, name, role, email, password }) {
  const oldUser = await findUserById(id);
  const pool = await connectDB();
  const request = pool.request().input('id', sql.Int, id);

  const updates = [];
  if (username !== undefined) {
    request.input('u', sql.NVarChar, username.trim().toLowerCase());
    updates.push('username = @u');
  }
  if (name !== undefined) {
    request.input('n', sql.NVarChar, name.trim());
    updates.push('name = @n');
  }
  if (role !== undefined) {
    request.input('r', sql.NVarChar, role);
    updates.push('role = @r');
  }
  if (email !== undefined) {
    request.input('e', sql.NVarChar, email.trim());
    updates.push('email = @e');
  }
  if (password !== undefined && password !== '') {
    request.input('p', sql.NVarChar, password);
    updates.push('password = @p');
  }

  if (updates.length === 0) {
    return findUserById(id);
  }

  const query = `
    UPDATE Users 
    SET ${updates.join(', ')} 
    OUTPUT INSERTED.id, INSERTED.username, INSERTED.name, INSERTED.role, INSERTED.email
    WHERE id = @id
  `;

  const result = await request.query(query);
  const updated = result.recordset[0] || null;

  if (oldUser && updated) {
    const oldEmail = (oldUser.email || '').trim().toLowerCase();
    const oldName = (oldUser.name || '').trim().toLowerCase();
    const oldUsername = (oldUser.username || '').trim().toLowerCase();

    // If role changed to 'admin', purge from Members since admins are not project team members
    if ((updated.role || '').toLowerCase() === 'admin') {
      await executeQuery(
        `DELETE FROM Members 
         WHERE LOWER(LTRIM(RTRIM(email))) = @e 
            OR LOWER(LTRIM(RTRIM(name))) = @n 
            OR LOWER(LTRIM(RTRIM(name))) = @u`,
        { e: oldEmail, n: oldName, u: oldUsername }
      );
    } else {
      // Synchronize Members table with new name and new email
      await executeQuery(
        `UPDATE Members 
         SET name = @newName, email = @newEmail 
         WHERE LOWER(LTRIM(RTRIM(email))) = @oldEmail 
            OR LOWER(LTRIM(RTRIM(name))) = @oldName 
            OR LOWER(LTRIM(RTRIM(name))) = @oldUser`,
        {
          newName: updated.name || updated.username,
          newEmail: updated.email,
          oldEmail,
          oldName,
          oldUser: oldUsername
        }
      );
    }

    // Synchronize Tasks assignee with new name
    if (updated.name && oldName && updated.name.toLowerCase() !== oldName) {
      await executeQuery(
        `UPDATE Tasks 
         SET assignee = @newName 
         WHERE LOWER(LTRIM(RTRIM(assignee))) = @oldName 
            OR LOWER(LTRIM(RTRIM(assignee))) = @oldUser`,
        { newName: updated.name, oldName, oldUser: oldUsername }
      );
    }
  }

  // Notify admin about user update
  try {
    if (updated) {
      await executeQuery(
        `INSERT INTO Notifications (target_role, target_user, type, title, message, priority, link_id, is_read)
         VALUES ('Admin', NULL, 'info', @title, @msg, 'Low', NULL, 0)`,
        {
          title: `✏️ User Updated: ${updated.name}`,
          msg: `You updated user account details for "${updated.name}" (@${updated.username}).`
        }
      );
    }
  } catch (err) {
    console.error('Warning: Could not create admin user update notification:', err.message);
  }

  return updated;
}

async function deleteUser(id) {
  const user = await findUserById(id);
  if (user) {
    const cleanEmail = (user.email || '').trim().toLowerCase();
    const cleanName = (user.name || '').trim().toLowerCase();
    const cleanUser = (user.username || '').trim().toLowerCase();
    
    // Remove member assignments from projects
    await executeQuery(
      `DELETE FROM Members 
       WHERE LOWER(LTRIM(RTRIM(email))) = @e 
          OR LOWER(LTRIM(RTRIM(name))) = @n 
          OR LOWER(LTRIM(RTRIM(name))) = @u`,
      { e: cleanEmail, n: cleanName, u: cleanUser }
    );

    // Unassign tasks assigned to deleted user
    await executeQuery(
      `UPDATE Tasks 
       SET assignee = 'Unassigned' 
       WHERE LOWER(LTRIM(RTRIM(assignee))) = @n 
          OR LOWER(LTRIM(RTRIM(assignee))) = @u`,
      { n: cleanName, u: cleanUser }
    );
  }

  const result = await executeQuery(
    `DELETE FROM Users WHERE id = @id`,
    { id }
  );

  // Notify admin about user deletion
  try {
    if (user) {
      await executeQuery(
        `INSERT INTO Notifications (target_role, target_user, type, title, message, priority, link_id, is_read)
         VALUES ('Admin', NULL, 'info', @title, @msg, 'Medium', NULL, 0)`,
        {
          title: `🗑️ User Deleted: ${user.name}`,
          msg: `You deleted account "${user.name}" (@${user.username}) and cleaned up their team and task assignments.`
        }
      );
    }
  } catch (err) {
    console.error('Warning: Could not create admin user delete notification:', err.message);
  }

  return result.rowsAffected[0] > 0;
}


/**
 * Retrieve projects assigned to a specific regular user
 * Returns ONLY projects the user is associated with.
 * Includes team count (not names) and user's specific tasks.
 */
async function getUserAssignedProjects(userName, userEmail, userUsername = '') {
  const pool = await connectDB();

  // Fast single batch query: fetches projects and all assigned tasks simultaneously
  const result = await pool.request()
    .input('userName', sql.NVarChar, userName || '')
    .input('userEmail', sql.NVarChar, userEmail || '')
    .input('userUsername', sql.NVarChar, userUsername || '')
    .query(`
      SELECT DISTINCT 
        p.id, 
        p.name, 
        p.code, 
        p.description, 
        p.category, 
        p.priority, 
        p.status, 
        p.start_date, 
        p.deadline, 
        p.progress,
        (SELECT COUNT(*) FROM Members m WHERE m.project_id = p.id) AS assignedMembersCount
      FROM Projects p
      WHERE 
        p.id IN (
          SELECT project_id FROM Members 
          WHERE LOWER(name) = LOWER(@userName) 
             OR (LOWER(name) = LOWER(@userUsername) AND @userUsername != '')
             OR (email = @userEmail AND @userEmail != '')
        )
        OR p.id IN (
          SELECT project_id FROM Tasks 
          WHERE LOWER(assignee) = LOWER(@userName) 
             OR (LOWER(assignee) = LOWER(@userUsername) AND @userUsername != '')
        )
      ORDER BY p.id DESC;

      SELECT 
        id, 
        project_id, 
        title, 
        description, 
        status, 
        priority, 
        due_date,
        completed_at,
        progress_percent,
        progress_note,
        updated_by
      FROM Tasks
      WHERE LOWER(assignee) = LOWER(@userName) OR (LOWER(assignee) = LOWER(@userUsername) AND @userUsername != '')
      ORDER BY id DESC;
    `);

  const projects = result.recordsets[0] || [];
  const allTasks = result.recordsets[1] || [];

  // Group tasks by project_id in memory (instant O(N))
  const tasksByProject = {};
  for (const t of allTasks) {
    if (!tasksByProject[t.project_id]) {
      tasksByProject[t.project_id] = [];
    }
    tasksByProject[t.project_id].push(t);
  }

  for (const proj of projects) {
    proj.myTasks = tasksByProject[proj.id] || [];
    if (proj.myTasks.length > 0) {
      const done = proj.myTasks.filter(t => (t.status || '').toLowerCase() === 'done').length;
      proj.progress = Math.round((done / proj.myTasks.length) * 100);
      proj.calculated_progress = proj.progress;
      proj.status = proj.progress === 100 ? 'Completed' : 'In Progress';
    } else {
      proj.progress = proj.progress || 0;
      proj.calculated_progress = proj.progress;
      proj.status = proj.progress === 100 ? 'Completed' : 'In Progress';
    }
  }

  return projects;
}

/**
 * Retrieve comprehensive user progress report for Admin Dashboard
 * Returns each user's assigned tasks, completion rate, deadline comparisons, and active tasks.
 */
async function getAllUsersProgress() {
  const pool = await connectDB();

  // 1. Fetch all registered users
  const usersRes = await pool.request().query(`
    SELECT id, username, name, email, role 
    FROM Users 
    WHERE LOWER(role) != 'admin'
    ORDER BY name ASC
  `);
  const users = usersRes.recordset || [];

  // 2. Fetch all tasks with project info
  const tasksRes = await pool.request().query(`
    SELECT 
      t.id, 
      t.project_id, 
      p.name AS project_name,
      p.code AS project_code,
      t.title, 
      t.description, 
      t.status, 
      t.priority, 
      t.assignee, 
      t.due_date, 
      t.completed_at, 
      t.progress_percent, 
      t.progress_note,
      t.updated_by
    FROM Tasks t
    LEFT JOIN Projects p ON p.id = t.project_id
    ORDER BY t.id DESC
  `);
  const allTasks = tasksRes.recordset || [];

  // Helper to calculate days diff
  const calcTiming = (completedAt, dueDate) => {
    if (!completedAt || !dueDate) {
      return { on_time: true, timing_label: completedAt ? `Completed on ${completedAt}` : 'Completed' };
    }
    const cDate = new Date(completedAt.split('T')[0]);
    const dDate = new Date(dueDate.split('T')[0]);
    if (isNaN(cDate.getTime()) || isNaN(dDate.getTime())) {
      return { on_time: true, timing_label: `Completed on ${completedAt}` };
    }
    const diffTime = cDate.getTime() - dDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    if (diffDays < 0) {
      return { on_time: true, days_diff: diffDays, timing_label: `Completed ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} early` };
    } else if (diffDays === 0) {
      return { on_time: true, days_diff: 0, timing_label: 'Completed on deadline day' };
    } else {
      return { on_time: false, days_diff: diffDays, timing_label: `Completed ${diffDays} day${diffDays === 1 ? '' : 's'} after deadline` };
    }
  };

  const userProgressList = users.map(user => {
    const userTasks = allTasks.filter(t => {
      const a = (t.assignee || '').toLowerCase().trim();
      const n = (user.name || '').toLowerCase().trim();
      const u = (user.username || '').toLowerCase().trim();
      return a === n || a === u || (n.length > 0 && a.includes(n));
    });

    const total = userTasks.length;
    const completedTasks = userTasks.filter(t => (t.status || '').toLowerCase() === 'done');
    const inProgressTasks = userTasks.filter(t => ['in_progress', 'review'].includes((t.status || '').toLowerCase()));
    const todoTasks = userTasks.filter(t => (t.status || '').toLowerCase() === 'todo');
    const completionRate = total > 0 ? Math.round((completedTasks.length / total) * 100) : 0;

    const completedWithTiming = completedTasks.map(t => {
      const timing = calcTiming(t.completed_at, t.due_date);
      return {
        ...t,
        ...timing
      };
    });

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      total_tasks: total,
      completed_count: completedTasks.length,
      in_progress_count: inProgressTasks.length,
      todo_count: todoTasks.length,
      completion_rate: completionRate,
      tasks: userTasks,
      completed_tasks: completedWithTiming,
      active_tasks: inProgressTasks.concat(todoTasks)
    };
  });

  return userProgressList;
}

module.exports = {
  findUserByUsername,
  findUserByName,
  findUserByEmail,
  findUserById,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserAssignedProjects,
  getAllUsersProgress
};
