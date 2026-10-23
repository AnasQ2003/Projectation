const { connectDB, sql } = require('../db');

async function listActivity(req, res) {
  try {
    const pool = await connectDB();
    const limit = parseInt(req.query.limit || req.body?.limit || '20', 10);
    const rawPid = req.query.project_id || req.body?.project_id;
    const projectId = rawPid ? parseInt(rawPid, 10) : null;

    let query = `
      SELECT TOP (@limit) 
        a.id, 
        a.project_id, 
        a.action, 
        a.[user], 
        a.created_at,
        p.name AS project_name
      FROM ActivityLogs a
      LEFT JOIN Projects p ON a.project_id = p.id
    `;

    if (projectId) {
      query += ` WHERE a.project_id = @pid`;
    }

    query += ` ORDER BY a.created_at DESC`;

    const request = pool.request().input('limit', sql.Int, limit);
    if (projectId) {
      request.input('pid', sql.Int, projectId);
    }

    const result = await request.query(query);
    return res.json(result.recordset);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
}

async function logActivity(req, res) {
  const { project_id, action, user } = req.body;
  if (!project_id || !action) {
    return res.status(400).json({ error: 'project_id and action are required' });
  }

  try {
    const pool = await connectDB();
    await pool.request()
      .input('pid', sql.Int, parseInt(project_id, 10))
      .input('action', sql.NVarChar, action)
      .input('user', sql.NVarChar, user || 'Admin')
      .query(`
        INSERT INTO ActivityLogs (project_id, action, [user])
        VALUES (@pid, @action, @user)
      `);

    return res.status(201).json({ success: true, message: 'Activity logged successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record activity log' });
  }
}

module.exports = {
  listActivity,
  logActivity
};
