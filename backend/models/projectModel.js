const { executeQuery } = require('../db');

async function fetchAllProjects() {
  const query = `
    SELECT 
      p.*,
      COUNT(DISTINCT m.id) AS member_count,
      COUNT(DISTINCT t.id) AS total_tasks,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS done_tasks
    FROM Projects p
    LEFT JOIN Members m ON m.project_id = p.id AND EXISTS (
      SELECT 1 FROM Users u 
      WHERE (
        LOWER(LTRIM(RTRIM(m.email))) = LOWER(LTRIM(RTRIM(u.email)))
        OR LOWER(LTRIM(RTRIM(m.name))) = LOWER(LTRIM(RTRIM(u.name)))
        OR LOWER(LTRIM(RTRIM(m.name))) = LOWER(LTRIM(RTRIM(u.username)))
      )
      AND LOWER(u.role) != 'admin'
    )
    LEFT JOIN Tasks t ON t.project_id = p.id
    GROUP BY p.id, p.name, p.code, p.description, p.category, p.priority, p.status, p.start_date, p.deadline, p.budget, p.progress, p.created_at
    ORDER BY p.id DESC
  `;

  const result = await executeQuery(query);
  return result.recordset.map(p => {
    let calcProgress = p.progress || 0;
    if (p.total_tasks > 0) {
      calcProgress = Math.round(((p.done_tasks || 0) / p.total_tasks) * 100);
    }
    return {
      ...p,
      progress: calcProgress,
      calculated_progress: calcProgress
    };
  });
}

/**
 * Fetch a single project with its assigned members, tasks, and activity logs
 */
async function fetchProjectById(projectId) {
  const projResult = await executeQuery('SELECT * FROM Projects WHERE id = @id', { id: projectId });
  const project = projResult.recordset[0];
  if (!project) return null;

  const [membersRes, tasksRes, logsRes] = await Promise.all([
    executeQuery(`
      SELECT m.* FROM Members m 
      WHERE m.project_id = @id 
        AND EXISTS (
          SELECT 1 FROM Users u 
          WHERE (
            LOWER(LTRIM(RTRIM(m.email))) = LOWER(LTRIM(RTRIM(u.email)))
            OR LOWER(LTRIM(RTRIM(m.name))) = LOWER(LTRIM(RTRIM(u.name)))
            OR LOWER(LTRIM(RTRIM(m.name))) = LOWER(LTRIM(RTRIM(u.username)))
          )
          AND LOWER(u.role) != 'admin'
        )
      ORDER BY m.id ASC
    `, { id: projectId }),
    executeQuery('SELECT * FROM Tasks WHERE project_id = @id ORDER BY id DESC', { id: projectId }),
    executeQuery('SELECT TOP 15 * FROM ActivityLogs WHERE project_id = @id ORDER BY id DESC', { id: projectId })
  ]);

  const tasks = tasksRes.recordset || [];
  let calculatedProgress = project.progress || 0;
  if (tasks.length > 0) {
    const doneTasks = tasks.filter(t => (t.status || '').toLowerCase() === 'done').length;
    calculatedProgress = Math.round((doneTasks / tasks.length) * 100);
  }

  return {
    ...project,
    progress: calculatedProgress,
    calculated_progress: calculatedProgress,
    members: membersRes.recordset || [],
    tasks,
    activity_logs: logsRes.recordset || []
  };
}

/**
 * Insert a new project and add an activity log
 */
async function insertProject({ name, code, description, category, priority, status, start_date, deadline, budget }) {
  const generatedCode = code ? code.toUpperCase() : name.slice(0, 4).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
  const startDateVal = start_date || new Date().toISOString().split('T')[0];

  const query = `
    INSERT INTO Projects (name, code, description, category, priority, status, start_date, deadline, budget, progress)
    OUTPUT INSERTED.id
    VALUES (@name, @code, @description, @category, @priority, @status, @start_date, @deadline, @budget, 0);
  `;

  const insRes = await executeQuery(query, {
    name,
    code: generatedCode,
    description: description || '',
    category: category || 'Software Development',
    priority: priority || 'Medium',
    status: status || 'In Progress',
    start_date: startDateVal,
    deadline,
    budget: parseFloat(budget) || 0
  });

  const newProjectId = insRes.recordset[0].id;

  // Log activity
  await executeQuery(
    `INSERT INTO ActivityLogs (project_id, action, [user]) VALUES (@pid, @action, @user)`,
    {
      pid: newProjectId,
      action: `Project created with deadline ${deadline}`,
      user: 'Admin'
    }
  );

  // Notify admin about their own creation
  try {
    await executeQuery(
      `INSERT INTO Notifications (target_role, target_user, type, title, message, priority, link_id, is_read)
       VALUES ('Admin', NULL, 'info', @title, @msg, 'Medium', @linkId, 0)`,
      {
        title: `✅ Project Created: ${name}`,
        msg: `You created project "${name}" [${generatedCode}] with deadline ${deadline}.`,
        linkId: newProjectId
      }
    );
  } catch (err) {
    console.error('Warning: Could not create project creation notification:', err.message);
  }

  return newProjectId;
}

/**
 * Update an existing project
 */
async function modifyProject(projectId, updateData) {
  const { name, code, description, category, priority, status, start_date, deadline, budget, progress } = updateData;

  const query = `
    UPDATE Projects 
    SET name = COALESCE(@name, name),
        code = COALESCE(@code, code),
        description = COALESCE(@description, description),
        category = COALESCE(@category, category),
        priority = COALESCE(@priority, priority),
        status = COALESCE(@status, status),
        start_date = COALESCE(@start_date, start_date),
        deadline = COALESCE(@deadline, deadline),
        budget = COALESCE(@budget, budget),
        progress = COALESCE(@progress, progress)
    WHERE id = @id;
  `;

  await executeQuery(query, {
    name: name !== undefined ? name : null,
    code: code !== undefined ? code : null,
    description: description !== undefined ? description : null,
    category: category !== undefined ? category : null,
    priority: priority !== undefined ? priority : null,
    status: status !== undefined ? status : null,
    start_date: start_date !== undefined ? start_date : null,
    deadline: deadline !== undefined ? deadline : null,
    budget: budget !== undefined ? parseFloat(budget) : null,
    progress: progress !== undefined ? parseInt(progress) : null,
    id: projectId
  });

  await executeQuery(
    `INSERT INTO ActivityLogs (project_id, action, [user]) VALUES (@pid, 'Project details updated', 'Admin')`,
    { pid: projectId }
  );

  // Notify admin about the update
  try {
    const projRes = await executeQuery('SELECT name FROM Projects WHERE id = @id', { id: projectId });
    const pName = (projRes.recordset[0] && projRes.recordset[0].name) || `Project #${projectId}`;
    await executeQuery(
      `INSERT INTO Notifications (target_role, target_user, type, title, message, priority, link_id, is_read)
       VALUES ('Admin', NULL, 'task_status', @title, @msg, 'Low', @linkId, 0)`,
      {
        title: `✏️ Project Updated: ${pName}`,
        msg: `You updated the details of project "${pName}".`,
        linkId: projectId
      }
    );
  } catch (err) {
    console.error('Warning: Could not create project update notification:', err.message);
  }
}

/**
 * Find project by name (case-insensitive) to prevent duplicate names
 */
async function findProjectByName(name, excludeId = null) {
  const cleanName = (name || '').trim().toLowerCase();
  if (!cleanName) return null;
  const query = excludeId
    ? 'SELECT * FROM Projects WHERE LOWER(LTRIM(RTRIM(name))) = @n AND id != @excludeId'
    : 'SELECT * FROM Projects WHERE LOWER(LTRIM(RTRIM(name))) = @n';
  const result = await executeQuery(query, { n: cleanName, excludeId });
  return result.recordset[0] || null;
}

/**
 * Delete a project by ID with full cascade of dependent records
 */
async function removeProject(projectId) {
  const pid = parseInt(projectId);
  // Capture project name before deletion for notification
  let deletedName = `Project #${pid}`;
  try {
    const projRes = await executeQuery('SELECT name FROM Projects WHERE id = @id', { id: pid });
    if (projRes.recordset[0]) deletedName = projRes.recordset[0].name;
  } catch (_) {}

  // 1. Delete tasks in this project
  await executeQuery('DELETE FROM Tasks WHERE project_id = @id', { id: pid });
  // 2. Delete team members in this project
  await executeQuery('DELETE FROM Members WHERE project_id = @id', { id: pid });
  // 3. Delete activity logs for this project
  await executeQuery('DELETE FROM ActivityLogs WHERE project_id = @id', { id: pid });
  // 4. Delete notifications linking to this project
  await executeQuery('DELETE FROM Notifications WHERE link_id = @id', { id: pid });
  // 5. Delete the project itself
  await executeQuery('DELETE FROM Projects WHERE id = @id', { id: pid });

  // 6. Notify admin about the deletion
  try {
    await executeQuery(
      `INSERT INTO Notifications (target_role, target_user, type, title, message, priority, link_id, is_read)
       VALUES ('Admin', NULL, 'info', @title, @msg, 'Low', NULL, 0)`,
      {
        title: `🗑️ Project Deleted`,
        msg: `You deleted project "${deletedName}" and all its tasks, members, and logs.`
      }
    );
  } catch (err) {
    console.error('Warning: Could not create project deletion notification:', err.message);
  }
}

module.exports = {
  fetchAllProjects,
  fetchProjectById,
  findProjectByName,
  insertProject,
  modifyProject,
  removeProject
};

