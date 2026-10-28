const { connectDB } = require('../db');

async function getProjectChartData(req, res) {
  try {
    const pool = await connectDB();

    const projectsRes = await pool.request().query(`
      SELECT
        p.id,
        p.name,
        p.code,
        p.status,
        p.progress,
        p.priority,
        p.deadline,
        COUNT(t.id) AS total_tasks,
        SUM(CASE WHEN LOWER(t.status) = 'done' THEN 1 ELSE 0 END) AS done_tasks,
        SUM(CASE WHEN LOWER(t.status) = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
        SUM(CASE WHEN LOWER(t.status) = 'review' THEN 1 ELSE 0 END) AS review_tasks,
        SUM(CASE WHEN LOWER(t.status) = 'todo' THEN 1 ELSE 0 END) AS todo_tasks
      FROM Projects p
      LEFT JOIN Tasks t ON t.project_id = p.id
      GROUP BY p.id, p.name, p.code, p.status, p.progress, p.priority, p.deadline
      ORDER BY p.id DESC
    `);

    const taskTrendRes = await pool.request().query(`
      SELECT
        CONVERT(NVARCHAR(10), COALESCE(completed_at, created_at, GETDATE()), 120) AS day,
        COUNT(*) AS count,
        SUM(CASE WHEN LOWER(status) = 'done' THEN 1 ELSE 0 END) AS done_count
      FROM Tasks
      WHERE COALESCE(completed_at, created_at) >= DATEADD(day, -30, GETDATE())
      GROUP BY CONVERT(NVARCHAR(10), COALESCE(completed_at, created_at, GETDATE()), 120)
      ORDER BY day ASC
    `);

    const tasksRes = await pool.request().query(`
      SELECT 
        id, 
        project_id, 
        title, 
        status, 
        priority, 
        assignee, 
        progress_percent, 
        due_date,
        completed_at,
        created_at
      FROM Tasks
      ORDER BY id DESC
    `);

    // Group tasks by project_id
    const tasksByProject = {};
    for (const t of (tasksRes.recordset || [])) {
      if (!tasksByProject[t.project_id]) {
        tasksByProject[t.project_id] = [];
      }
      tasksByProject[t.project_id].push(t);
    }

    const projects = projectsRes.recordset.map(function(p) {
      const projTasks = tasksByProject[p.id] || [];
      const total = projTasks.length;
      const done = projTasks.filter(t => (t.status || '').toLowerCase() === 'done').length;
      const in_progress = projTasks.filter(t => (t.status || '').toLowerCase() === 'in_progress').length;
      const review = projTasks.filter(t => (t.status || '').toLowerCase() === 'review').length;
      const todo = projTasks.filter(t => ['todo', ''].includes((t.status || '').toLowerCase())).length;

      const urgent = projTasks.filter(t => (t.priority || '').toLowerCase() === 'urgent').length;
      const high = projTasks.filter(t => (t.priority || '').toLowerCase() === 'high').length;
      const medium = projTasks.filter(t => (t.priority || '').toLowerCase() === 'medium').length;
      const low = projTasks.filter(t => (t.priority || '').toLowerCase() === 'low').length;

      // Group by assignee
      const assigneeMap = {};
      for (const t of projTasks) {
        const name = (t.assignee || 'Unassigned').trim();
        if (!assigneeMap[name]) {
          assigneeMap[name] = { name, total: 0, done: 0, in_progress: 0, review: 0, todo: 0 };
        }
        assigneeMap[name].total++;
        const st = (t.status || '').toLowerCase();
        if (st === 'done') assigneeMap[name].done++;
        else if (st === 'in_progress') assigneeMap[name].in_progress++;
        else if (st === 'review') assigneeMap[name].review++;
        else assigneeMap[name].todo++;
      }

      const computedProgress = total > 0 ? Math.round((done / total) * 100) : (p.progress || 0);

      return {
        id: p.id,
        name: p.name,
        code: p.code,
        status: p.status,
        priority: p.priority,
        deadline: p.deadline,
        progress: computedProgress,
        tasks: {
          total: total,
          done: done,
          in_progress: in_progress,
          review: review,
          todo: todo
        },
        priorities: {
          urgent: urgent,
          high: high,
          medium: medium,
          low: low
        },
        assignees: Object.values(assigneeMap),
        items: projTasks.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          assignee: t.assignee,
          progress_percent: t.progress_percent,
          due_date: t.due_date
        }))
      };
    });

    return res.json({
      projects: projects,
      taskTrend: taskTrendRes.recordset || []
    });
  } catch(err) {
    console.error('Chart data error:', err);
    return res.status(500).json({ error: 'Failed to fetch chart data' });
  }
}

module.exports = { getProjectChartData };
