const { executeQuery } = require('../db');

const AVATAR_COLORS = ['#2563eb', '#0891b2', '#db2777', '#16a34a', '#d97706', '#7c3aed'];

function randomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

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
    `INSERT INTO ActivityLogs (project_id, action, [user]) VALUES (@pid, @action, 'Admin')`,
    { pid: parseInt(project_id), action: `Added team member: ${name} (${role})` }
  );

  return { id: insRes.recordset[0].id, project_id, name, email, role, avatar_color: color };
}

/**
 * Update an existing member
 */
async function modifyMember(memberId, { name, email, role, project_id, avatar_color }) {
  let oldMember = null;
  if (name !== undefined) {
    const prevRes = await executeQuery('SELECT * FROM Members WHERE id = @id', { id: memberId });
    oldMember = prevRes.recordset[0];
  }

  const query = `
    UPDATE Members
    SET name = COALESCE(@name, name),
        email = COALESCE(@email, email),
        role = COALESCE(@role, role),
        project_id = COALESCE(@pid, project_id),
        avatar_color = COALESCE(@color, avatar_color)
    WHERE id = @id;
  `;

  await executeQuery(query, {
    name: name !== undefined ? name : null,
    email: email !== undefined ? email : null,
    role: role !== undefined ? role : null,
    pid: project_id !== undefined ? parseInt(project_id) : null,
    color: avatar_color !== undefined ? avatar_color : null,
    id: memberId
  });

  if (oldMember && oldMember.name && name && oldMember.name !== name) {
    await executeQuery(
      'UPDATE Tasks SET assignee = @newName WHERE assignee = @oldName',
      { newName: name, oldName: oldMember.name }
    );
  }
}

/**
 * Delete a member by ID
 */
async function removeMember(memberId) {
  await executeQuery('DELETE FROM Members WHERE id = @id', { id: memberId });
}

/**
 * Find member by exact name (case-insensitive)
 */
async function findMemberByName(name, excludeId = null) {
  const cleanName = (name || '').trim().toLowerCase();
  if (!cleanName) return null;
  const query = excludeId 
    ? `SELECT * FROM Members WHERE LOWER(LTRIM(RTRIM(name))) = @n AND id != @excludeId`
    : `SELECT * FROM Members WHERE LOWER(LTRIM(RTRIM(name))) = @n`;
  const result = await executeQuery(query, { n: cleanName, excludeId });
  return result.recordset[0] || null;
}

/**
 * Find member by exact email (case-insensitive)
 */
async function findMemberByEmail(email, excludeId = null) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return null;
  const query = excludeId 
    ? `SELECT * FROM Members WHERE LOWER(LTRIM(RTRIM(email))) = @e AND id != @excludeId`
    : `SELECT * FROM Members WHERE LOWER(LTRIM(RTRIM(email))) = @e`;
  const result = await executeQuery(query, { e: cleanEmail, excludeId });
  return result.recordset[0] || null;
}

/**
 * Find member within a specific project by name or email
 */
async function findMemberInProject(projectId, name, email, excludeId = null) {
  const cleanName = (name || '').trim().toLowerCase();
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanName && !cleanEmail) return null;

  let query = `
    SELECT * FROM Members 
    WHERE project_id = @pid 
      AND (
        (LEN(@n) > 0 AND LOWER(LTRIM(RTRIM(name))) = @n)
        OR (LEN(@e) > 0 AND LOWER(LTRIM(RTRIM(email))) = @e)
      )
  `;
  if (excludeId) {
    query += ` AND id != @excludeId`;
  }
  const result = await executeQuery(query, {
    pid: parseInt(projectId),
    n: cleanName,
    e: cleanEmail,
    excludeId: excludeId ? parseInt(excludeId) : null
  });
  return result.recordset[0] || null;
}

module.exports = {
  fetchAllMembers,
  insertMember,
  modifyMember,
  removeMember,
  findMemberByName,
  findMemberByEmail,
  findMemberInProject
};

