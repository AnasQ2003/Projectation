const { executeQuery } = require('../db');

/**
 * Fetch high-level KPI counts for the dashboard
 */
async function fetchGlobalStats() {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM Projects) AS total_projects,
      (SELECT COUNT(*) FROM Tasks WHERE status != 'done') AS active_tasks,
      (SELECT COUNT(*) FROM Tasks WHERE status = 'done') AS completed_tasks,
      (SELECT COUNT(*) FROM Members) AS total_members
  `;
  const result = await executeQuery(query);
  return result.recordset[0];
}

module.exports = {
  fetchGlobalStats
};
