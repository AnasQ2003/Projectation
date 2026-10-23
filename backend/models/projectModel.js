const { executeQuery } = require('../db');

/**
 * Fetch all projects along with member & task count aggregates
 */
async function fetchAllProjects() {
  const query = `
    SELECT 
      p.*,
      COUNT(DISTINCT m.id) AS member_count,
      COUNT(DISTINCT t.id) AS total_tasks,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS done_tasks
    FROM Projects p
    LEFT JOIN Members m ON m.project_id = p.id
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
    executeQuery('SELECT * FROM Members WHERE project_id = @id ORDER BY id ASC', { id: projectId }),
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
}

/**
 * Delete a project by ID
 */
async function removeProject(projectId) {
  await executeQuery('DELETE FROM Projects WHERE id = @id', { id: projectId });
}

module.exports = {
  fetchAllProjects,
  fetchProjectById,
  insertProject,
  modifyProject,
  removeProject
};
