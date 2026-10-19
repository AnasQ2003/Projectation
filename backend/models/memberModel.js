const { executeQuery } = require('../db');

const AVATAR_COLORS = ['#2563eb', '#0891b2', '#db2777', '#16a34a', '#d97706', '#7c3aed'];

function randomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

/**
 * Fetch all members with task completion metrics
 */
async function fetchAllMembers() {
  const query = `
    SELECT 
      m.id,
      m.project_id,
      m.name,
      m.email,
      m.role,
      m.avatar_color,
      p.name AS project_name,
      p.code AS project_code,
      ISNULL((SELECT COUNT(*) FROM Tasks t WHERE t.project_id = m.project_id AND t.assignee = m.name), 0) AS tasks_assigned,
      ISNULL((SELECT COUNT(*) FROM Tasks t WHERE t.project_id = m.project_id AND t.assignee = m.name AND t.status = 'done'), 0) AS tasks_completed,
      ISNULL((SELECT COUNT(*) FROM Tasks t WHERE t.project_id = m.project_id AND t.assignee = m.name AND t.status != 'done'), 0) AS tasks_pending
    FROM Members m
    LEFT JOIN Projects p ON p.id = m.project_id
    ORDER BY m.id DESC
  `;
  const result = await executeQuery(query);

  const tasksRes = await executeQuery('SELECT * FROM Tasks ORDER BY id DESC');
  const allTasks = tasksRes.recordset || [];

  return result.recordset.map(m => {
    const memberTasks = allTasks.filter(t => t.project_id === m.project_id && t.assignee === m.name);
    const total = m.tasks_assigned;
    const done = m.tasks_completed;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    return { ...m, completion_rate: rate, tasks: memberTasks };
  });
}

/**
 * Insert a member linked to a project
 */
async function insertMember({ project_id, name, email, role, avatar_color }) {
  const color = avatar_color || randomColor();

  const query = `
    INSERT INTO Members (project_id, name, email, role, avatar_color)
    OUTPUT INSERTED.id
    VALUES (@pid, @name, @email, @role, @color);
  `;
  const insRes = await executeQuery(query, {
    pid: parseInt(project_id),
    name,
    email,
    role,
    color
  });

  await executeQuery(
    `INSERT INTO ActivityLogs (project_id, action, [user]) VALUES (@pid, @action, 'Anas (Admin)')`,
    { pid: parseInt(project_id), action: `Added team member: ${name} (${role})` }
  );

  return { id: insRes.recordset[0].id, project_id, name, email, role, avatar_color: color };
}

/**
 * Delete a member by ID
 */
async function removeMember(memberId) {
  await executeQuery('DELETE FROM Members WHERE id = @id', { id: memberId });
}

module.exports = {
  fetchAllMembers,
  insertMember,
  removeMember
};
