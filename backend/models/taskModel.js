const { executeQuery } = require('../db');

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
    `INSERT INTO ActivityLogs (project_id, action, [user]) VALUES (@pid, @action, 'Anas (Admin)')`,
    { pid, action: `Created task: "${title}"` }
  );

  return insRes.recordset[0].id;
}

/**
 * Update an existing task (partial update using COALESCE) and recalculate project progress in DB
 */
async function modifyTask(taskId, { title, description, status, priority, assignee, due_date }) {
  const query = `
    DECLARE @pid INT;
    SELECT @pid = project_id FROM Tasks WHERE id = @id;

    UPDATE Tasks
    SET title       = COALESCE(@title, title),
        description = COALESCE(@description, description),
        status      = COALESCE(@status, status),
        priority    = COALESCE(@priority, priority),
        assignee    = COALESCE(@assignee, assignee),
        due_date    = COALESCE(@due_date, due_date)
    WHERE id = @id;

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

  await executeQuery(query, {
    title:       title !== undefined       ? title       : null,
    description: description !== undefined ? description : null,
    status:      status !== undefined      ? status      : null,
    priority:    priority !== undefined    ? priority    : null,
    assignee:    assignee !== undefined    ? assignee    : null,
    due_date:    due_date !== undefined    ? due_date    : null,
    id: parseInt(taskId)
  });
}

/**
 * Delete a task by ID and recalculate project progress in DB
 */
async function removeTask(taskId) {
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

  await executeQuery(query, { id: parseInt(taskId) });
}

module.exports = {
  fetchAllTasks,
  insertTask,
  modifyTask,
  removeTask
};
