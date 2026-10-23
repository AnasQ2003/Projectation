const { connectDB } = require('../db');

async function getSummary(req, res) {
  try {
    const pool = await connectDB();

    const [statusStats, priorityStats, budgetStats, memberStats] = await Promise.all([
      pool.request().query(`
        SELECT status, COUNT(*) AS count 
        FROM Tasks 
        GROUP BY status
      `),
      pool.request().query(`
        SELECT priority, COUNT(*) AS count 
        FROM Tasks 
        GROUP BY priority
      `),
      pool.request().query(`
        SELECT 
          SUM(budget) AS total_budget,
          AVG(progress) AS avg_progress,
          COUNT(*) AS total_projects
        FROM Projects
      `),
      pool.request().query(`
        SELECT COUNT(DISTINCT email) AS total_unique_members FROM Members
      `)
    ]);

    const taskDistribution = {
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0
    };
    statusStats.recordset.forEach(row => {
      const s = (row.status || '').toLowerCase();
      if (taskDistribution[s] !== undefined) {
        taskDistribution[s] = row.count;
      }
    });

    const priorityDistribution = {
      Urgent: 0,
      High: 0,
      Medium: 0,
      Low: 0
    };
    priorityStats.recordset.forEach(row => {
      if (priorityDistribution[row.priority] !== undefined) {
        priorityDistribution[row.priority] = row.count;
      }
    });

    const b = budgetStats.recordset[0] || {};
    const totalTasks = Object.values(taskDistribution).reduce((a, b) => a + b, 0);
    const completionRate = totalTasks > 0 ? Math.round((taskDistribution.done / totalTasks) * 100) : 0;

    return res.json({
      projects: {
        total: b.total_projects || 0,
        averageProgress: Math.round(b.avg_progress || 0),
        totalBudget: b.total_budget || 0
      },
      tasks: {
        total: totalTasks,
        completionRate,
        byStatus: taskDistribution,
        byPriority: priorityDistribution
      },
      team: {
        uniqueMembers: memberStats.recordset[0]?.total_unique_members || 0
      },
      velocity: {
        completedThisWeek: taskDistribution.done,
        velocityScore: Math.min(100, Math.round(completionRate * 1.15))
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compute analytics summary' });
  }
}

module.exports = {
  getSummary
};
