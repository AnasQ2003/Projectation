const { executeQuery } = require('../db');
const { broadcastEvent } = require('../controllers/eventsController');

/**
 * Fetch all tasks across all projects (with project name/code)
 */
async function fetchAllTasks() {
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
  return result.recordset || [];
}

/**
 * Insert a new task and log activity, and update project progress in DB
 */
async function insertTask({ project_id, title, description, status, priority, assignee, due_date }) {
  const pid = parseInt(project_id);
  const query = `
    INSERT INTO Tasks (project_id, title, description, status, priority, assignee, due_date)
    OUTPUT INSERTED.id
    VALUES (@pid, @title, @desc, @status, @priority, @assignee, @due_date);

    UPDATE Projects
    SET progress = (
      SELECT CASE WHEN COUNT(*) = 0 THEN 0 ELSE (SUM(CASE WHEN LOWER(status) = 'done' THEN 1 ELSE 0 END) * 100) / COUNT(*) END
      FROM Tasks
      WHERE project_id = @pid
    )
    WHERE id = @pid;
  `;

  const insRes = await executeQuery(query, {
    pid,
    title,
    desc: description || '',
    status: status || 'todo',
    priority: priority || 'Medium',
    assignee: assignee || 'Unassigned',
    due_date: due_date || null
  });

  await executeQuery(
    `INSERT INTO ActivityLogs (project_id, action, [user]) VALUES (@pid, @action, 'Admin')`,
    { pid, action: `Created task: "${title}"` }
  );

  // Notify the assigned user about the new task assignment
  if (assignee && assignee !== 'Unassigned') {
    try {
      await executeQuery(
        `INSERT INTO Notifications (target_role, target_user, type, title, message, priority, link_id, is_read)
         VALUES ('User', @assignee, 'assignment', @title, @msg, @pri, @linkId, 0)`,
        {
          assignee: assignee.toLowerCase(),
          title: `New Task Assigned: ${title}`,
          msg: `You have been assigned a new task: "${title}". Please check your workspace for details and deadlines.`,
          pri: priority || 'Medium',
          linkId: pid
        }
      );
    } catch (notifErr) {
      console.error('Warning: Could not create user assignment notification:', notifErr.message);
    }
  }

  // Notify admin about task creation
  try {
    const projRes = await executeQuery('SELECT name FROM Projects WHERE id = @id', { id: pid });
    const pName = (projRes.recordset[0] && projRes.recordset[0].name) || `Project #${pid}`;
    await executeQuery(
      `INSERT INTO Notifications (target_role, target_user, type, title, message, priority, link_id, is_read)
       VALUES ('Admin', NULL, 'info', @title, @msg, 'Medium', @linkId, 0)`,
      {
        title: `✅ Task Created: ${title}`,
        msg: `You created task "${title}" in "${pName}" (Assigned to: ${assignee || 'Unassigned'}).`,
        linkId: pid
      }
    );
  } catch (adminErr) {
    console.error('Warning: Could not create admin task notification:', adminErr.message);
  }

  return insRes.recordset[0].id;
}

/**
 * Update an existing task (partial update using COALESCE) and recalculate project progress in DB
 */
async function modifyTask(taskId, { title, description, status, priority, assignee, due_date, progress_percent, progress_note, completed_at, updated_by }) {
  const query = `
    DECLARE @pid INT;
    SELECT @pid = project_id FROM Tasks WHERE id = @id;

    UPDATE Tasks
    SET title            = COALESCE(@title, title),
        description      = COALESCE(@description, description),
        status           = COALESCE(@status, status),
        priority         = COALESCE(@priority, priority),
        assignee         = COALESCE(@assignee, assignee),
        due_date         = COALESCE(@due_date, due_date),
        progress_percent = CASE 
                             WHEN @progress_percent IS NOT NULL THEN @progress_percent
                             WHEN LOWER(@status) = 'done' THEN 100
                             WHEN LOWER(@status) = 'todo' AND progress_percent = 100 THEN 0
                             ELSE progress_percent
                           END,
        progress_note    = COALESCE(@progress_note, progress_note),
        completed_at     = CASE
                             WHEN LOWER(@status) = 'done' THEN COALESCE(@completed_at, completed_at, CONVERT(NVARCHAR(10), GETDATE(), 120))
                             WHEN @status IS NOT NULL AND LOWER(@status) != 'done' THEN NULL
                             ELSE completed_at
                           END,
        updated_by       = COALESCE(@updated_by, updated_by)
    WHERE id = @id;

    IF @pid IS NOT NULL
    BEGIN
      UPDATE Projects
      SET progress = (
        SELECT CASE WHEN COUNT(*) = 0 THEN 0 ELSE (SUM(CASE WHEN LOWER(status) = 'done' THEN 1 ELSE 0 END) * 100) / COUNT(*) END
        FROM Tasks
        WHERE project_id = @pid
      ),
      status = CASE 
        WHEN (SELECT COUNT(*) FROM Tasks WHERE project_id = @pid) > 0 
         AND (SELECT COUNT(*) FROM Tasks WHERE project_id = @pid AND LOWER(status) != 'done') = 0 
        THEN 'Completed'
        ELSE 'In Progress'
      END
      WHERE id = @pid;
    END;
  `;

  await executeQuery(query, {
    title:            title !== undefined            ? title            : null,
    description:      description !== undefined      ? description      : null,
    status:           status !== undefined           ? status           : null,
    priority:         priority !== undefined         ? priority         : null,
    assignee:         assignee !== undefined         ? assignee         : null,
    due_date:         due_date !== undefined         ? due_date         : null,
    progress_percent: progress_percent !== undefined ? parseInt(progress_percent) : null,
    progress_note:    progress_note !== undefined    ? progress_note    : null,
    completed_at:     completed_at !== undefined     ? completed_at     : null,
    updated_by:       updated_by !== undefined       ? updated_by       : null,
    id: parseInt(taskId)
  });

  // Log activity and create notification for admin
  try {
    const taskInfoRes = await executeQuery(`
      SELECT t.id, t.title, t.status, t.due_date, t.completed_at, t.progress_percent, t.assignee, t.project_id, p.name AS project_name
      FROM Tasks t
      LEFT JOIN Projects p ON p.id = t.project_id
      WHERE t.id = @id
    `, { id: parseInt(taskId) });

    if (taskInfoRes.recordset && taskInfoRes.recordset.length > 0) {
      const t = taskInfoRes.recordset[0];
      const actor = updated_by || t.assignee || 'Team Member';
      const isDone = (t.status || '').toLowerCase() === 'done';
      const actionMsg = isDone 
        ? `Completed task "${t.title}" (Completed: ${t.completed_at || 'Today'}, Deadline: ${t.due_date || 'N/A'})`
        : `Updated task "${t.title}" status to ${t.status} (${t.progress_percent || 0}% completed)`;

      if (t.project_id) {
        await executeQuery(
          `INSERT INTO ActivityLogs (project_id, action, [user]) VALUES (@pid, @action, @actor)`,
          { pid: t.project_id, action: actionMsg, actor }
        );
      }

      // Notify Admin about the task update via DB
      await executeQuery(
        `INSERT INTO Notifications (target_role, target_user, type, title, message, priority, link_id, is_read)
         VALUES ('Admin', NULL, @type, @title, @msg, @pri, @linkId, 0)`,
        {
          type: isDone ? 'task_completed' : 'task_status',
          title: isDone ? `\u2705 Task Completed: ${t.title}` : `\uD83D\uDCCA Progress Update: ${t.title}`,
          msg: `${actor} in ${t.project_name || 'Project'}: ${actionMsg}`,
          pri: isDone ? 'High' : 'Medium',
          linkId: t.project_id || null
        }
      );

      // Instant SSE push to Admin — no polling latency
      broadcastEvent({
        type: isDone ? 'task_completed' : 'task_status',
        title: isDone ? `\u2705 Task Completed: ${t.title}` : `\uD83D\uDCCA Progress Update: ${t.title}`,
        message: `${actor} in ${t.project_name || 'Project'}: ${actionMsg}`,
        priority: isDone ? 'High' : 'Medium',
        linkId: t.project_id || null
      }, 'Admin');

      // Also notify the user themselves with a confirmation (if updated_by is set)
      if (updated_by) {
        const confirmMsg = isDone
          ? `Your task "${t.title}" has been marked as completed. Great work!`
          : `Your task "${t.title}" progress updated to ${t.progress_percent || 0}% - ${t.status}.`;
        await executeQuery(
          `INSERT INTO Notifications (target_role, target_user, type, title, message, priority, link_id, is_read)
           VALUES ('User', @targetUser, 'task_status', @title, @msg, @pri, @linkId, 0)`,
          {
            targetUser: updated_by.toLowerCase(),
            title: isDone ? '🎉 Task Completed!' : '📋 Progress Saved',
            msg: confirmMsg,
            pri: 'Low',
            linkId: t.project_id || null
          }
        );
      }
    }
  } catch (err) {
    console.error('Error logging task activity or notification:', err.message);
  }
}

/**
 * Delete a task by ID and recalculate project progress in DB
 */
async function removeTask(taskId) {
  const tid = parseInt(taskId);
  let taskTitle = `Task #${tid}`;
  let projectName = 'Project';
  let pid = null;

  try {
    const tRes = await executeQuery(`
      SELECT t.title, t.project_id, p.name AS project_name
      FROM Tasks t
      LEFT JOIN Projects p ON p.id = t.project_id
      WHERE t.id = @id
    `, { id: tid });
    if (tRes.recordset && tRes.recordset[0]) {
      taskTitle = tRes.recordset[0].title || taskTitle;
      projectName = tRes.recordset[0].project_name || projectName;
      pid = tRes.recordset[0].project_id;
    }
  } catch (_) {}

  const query = `
    DECLARE @pid INT;
    SELECT @pid = project_id FROM Tasks WHERE id = @id;

    DELETE FROM Tasks WHERE id = @id;

    IF @pid IS NOT NULL
    BEGIN
      UPDATE Projects
      SET progress = (
        SELECT CASE WHEN COUNT(*) = 0 THEN 0 ELSE (SUM(CASE WHEN LOWER(status) = 'done' THEN 1 ELSE 0 END) * 100) / COUNT(*) END
        FROM Tasks
        WHERE project_id = @pid
      )
      WHERE id = @pid;
    END;
  `;

  await executeQuery(query, { id: tid });

  // Notify admin about task deletion
  try {
    await executeQuery(
      `INSERT INTO Notifications (target_role, target_user, type, title, message, priority, link_id, is_read)
       VALUES ('Admin', NULL, 'info', @title, @msg, 'Low', @linkId, 0)`,
      {
        title: `🗑️ Task Deleted: ${taskTitle}`,
        msg: `You deleted task "${taskTitle}" from "${projectName}".`,
        linkId: pid
      }
    );
  } catch (err) {
    console.error('Warning: Could not create admin task deletion notification:', err.message);
  }
}

module.exports = {
  fetchAllTasks,
  insertTask,
  modifyTask,
  removeTask
};
