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

    const projects = projectsRes.recordset.map(function(p) {
      const total = p.total_tasks || 0;
      const done = p.done_tasks || 0;
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
          in_progress: p.in_progress_tasks || 0,
          review: p.review_tasks || 0,
          todo: p.todo_tasks || 0
        }
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
