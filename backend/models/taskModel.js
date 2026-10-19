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
 * Insert a new task and log activity
 */
async function insertTask({ project_id, title, description, status, priority, assignee, due_date }) {
  const query = `
    INSERT INTO Tasks (project_id, title, description, status, priority, assignee, due_date)
    OUTPUT INSERTED.id
    VALUES (@pid, @title, @desc, @status, @priority, @assignee, @due_date);
  `;

  const insRes = await executeQuery(query, {
    pid: parseInt(project_id),
    title,
    desc: description || '',
    status: status || 'todo',
    priority: priority || 'Medium',
    assignee: assignee || 'Unassigned',
    due_date: due_date || null
  });

  await executeQuery(
    `INSERT INTO ActivityLogs (project_id, action, [user]) VALUES (@pid, @action, 'Anas (Admin)')`,
    { pid: parseInt(project_id), action: `Created task: "${title}"` }
  );

  return insRes.recordset[0].id;
}

/**
 * Update an existing task (partial update using COALESCE)
 */
async function modifyTask(taskId, { title, description, status, priority, assignee, due_date }) {
  const query = `
    UPDATE Tasks
    SET title       = COALESCE(@title, title),
        description = COALESCE(@description, description),
        status      = COALESCE(@status, status),
        priority    = COALESCE(@priority, priority),
        assignee    = COALESCE(@assignee, assignee),
        due_date    = COALESCE(@due_date, due_date)
    WHERE id = @id;
  `;

  await executeQuery(query, {
    title:       title !== undefined       ? title       : null,
    description: description !== undefined ? description : null,
    status:      status !== undefined      ? status      : null,
    priority:    priority !== undefined    ? priority    : null,
    assignee:    assignee !== undefined    ? assignee    : null,
    due_date:    due_date !== undefined    ? due_date    : null,
    id: taskId
  });
}

/**
 * Delete a task by ID
 */
async function removeTask(taskId) {
  await executeQuery('DELETE FROM Tasks WHERE id = @id', { id: taskId });
}

module.exports = {
  fetchAllTasks,
  insertTask,
  modifyTask,
  removeTask
};
