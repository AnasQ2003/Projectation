const { executeQuery, connectDB, sql } = require('../db');

/**
 * User Model (Layer 4 — Data Access & SQL Queries)
 * Talks directly to Microsoft SQL Server via db.js
 */

/**
 * Find user by username
 */
async function findUserByUsername(username, excludeId = null) {
  const cleanUser = (username || '').trim().toLowerCase();
  if (!cleanUser) return null;
  const query = excludeId
    ? `SELECT * FROM Users WHERE LOWER(LTRIM(RTRIM(username))) = @u AND id != @excludeId`
    : `SELECT * FROM Users WHERE LOWER(LTRIM(RTRIM(username))) = @u`;
  const result = await executeQuery(query, { u: cleanUser, excludeId });
  return result.recordset[0] || null;
}

/**
 * Find user by exact name (case-insensitive)
 */
async function findUserByName(name, excludeId = null) {
  const cleanName = (name || '').trim().toLowerCase();
  if (!cleanName) return null;
  const query = excludeId 
    ? `SELECT * FROM Users WHERE LOWER(LTRIM(RTRIM(name))) = @n AND id != @excludeId`
    : `SELECT * FROM Users WHERE LOWER(LTRIM(RTRIM(name))) = @n`;
  const result = await executeQuery(query, { n: cleanName, excludeId });
  return result.recordset[0] || null;
}

/**
 * Find user by exact email (case-insensitive)
 */
async function findUserByEmail(email, excludeId = null) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return null;
  const query = excludeId
    ? `SELECT * FROM Users WHERE LOWER(LTRIM(RTRIM(email))) = @e AND id != @excludeId`
    : `SELECT * FROM Users WHERE LOWER(LTRIM(RTRIM(email))) = @e`;
  const result = await executeQuery(query, { e: cleanEmail, excludeId });
  return result.recordset[0] || null;
}

/**
 * Find user by ID
 */
async function findUserById(id) {
  const result = await executeQuery(
    `SELECT id, username, name, role, email FROM Users WHERE id = @id`,
    { id }
  );
  return result.recordset[0] || null;
}

/**
 * List all users (for Admin management)
 */
async function getAllUsers() {
  const result = await executeQuery(
    `SELECT id, username, name, role, email FROM Users ORDER BY id ASC`
  );
  return result.recordset;
}

/**
 * Insert a new user (Admin only)
 */
async function createUser({ username, password, name, role, email }) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('u', sql.NVarChar, username.trim().toLowerCase())
    .input('p', sql.NVarChar, password)
    .input('n', sql.NVarChar, name.trim())
    .input('r', sql.NVarChar, role || 'User')
    .input('e', sql.NVarChar, email || `${username.trim().toLowerCase()}@softwarehouse.dev`)
    .query(`
      INSERT INTO Users (username, password, name, role, email)
      OUTPUT INSERTED.id, INSERTED.username, INSERTED.name, INSERTED.role, INSERTED.email
      VALUES (@u, @p, @n, @r, @e)
    `);
  return result.recordset[0];
}

/**
 * Update an existing user (Admin only)
 */
async function updateUser(id, { username, name, role, email, password }) {
  const pool = await connectDB();
  const request = pool.request().input('id', sql.Int, id);

  const updates = [];
  if (username !== undefined) {
    request.input('u', sql.NVarChar, username.trim().toLowerCase());
    updates.push('username = @u');
  }
  if (name !== undefined) {
    request.input('n', sql.NVarChar, name.trim());
    updates.push('name = @n');
  }
  if (role !== undefined) {
    request.input('r', sql.NVarChar, role);
    updates.push('role = @r');
  }
  if (email !== undefined) {
    request.input('e', sql.NVarChar, email.trim());
    updates.push('email = @e');
  }
  if (password !== undefined && password !== '') {
    request.input('p', sql.NVarChar, password);
    updates.push('password = @p');
  }

  if (updates.length === 0) {
    return findUserById(id);
  }

  const query = `
    UPDATE Users 
    SET ${updates.join(', ')} 
    OUTPUT INSERTED.id, INSERTED.username, INSERTED.name, INSERTED.role, INSERTED.email
    WHERE id = @id
  `;

  const result = await request.query(query);
  return result.recordset[0] || null;
}

/**
 * Delete a user (Admin only)
 */
async function deleteUser(id) {
  const result = await executeQuery(
    `DELETE FROM Users WHERE id = @id`,
    { id }
  );
  return result.rowsAffected[0] > 0;
}

/**
 * Retrieve projects assigned to a specific regular user
 * Returns ONLY projects the user is associated with.
 * Includes team count (not names) and user's specific tasks.
 */
async function getUserAssignedProjects(userName, userEmail, userUsername = '') {
  const pool = await connectDB();

  // Fast single batch query: fetches projects and all assigned tasks simultaneously
  const result = await pool.request()
    .input('userName', sql.NVarChar, userName || '')
    .input('userEmail', sql.NVarChar, userEmail || '')
    .input('userUsername', sql.NVarChar, userUsername || '')
    .query(`
      SELECT DISTINCT 
        p.id, 
        p.name, 
        p.code, 
        p.description, 
        p.category, 
        p.priority, 
        p.status, 
        p.start_date, 
        p.deadline, 
        p.progress,
        (SELECT COUNT(*) FROM Members m WHERE m.project_id = p.id) AS assignedMembersCount
      FROM Projects p
      WHERE 
        p.id IN (
          SELECT project_id FROM Members 
          WHERE LOWER(name) = LOWER(@userName) 
             OR (LOWER(name) = LOWER(@userUsername) AND @userUsername != '')
             OR (email = @userEmail AND @userEmail != '')
        )
        OR p.id IN (
          SELECT project_id FROM Tasks 
          WHERE LOWER(assignee) = LOWER(@userName) 
             OR (LOWER(assignee) = LOWER(@userUsername) AND @userUsername != '')
        )
      ORDER BY p.id DESC;

      SELECT 
        id, 
        project_id, 
        title, 
        description, 
        status, 
        priority, 
        due_date
      FROM Tasks
      WHERE LOWER(assignee) = LOWER(@userName) OR (LOWER(assignee) = LOWER(@userUsername) AND @userUsername != '')
      ORDER BY id DESC;
    `);

  const projects = result.recordsets[0] || [];
  const allTasks = result.recordsets[1] || [];

  // Group tasks by project_id in memory (instant O(N))
  const tasksByProject = {};
  for (const t of allTasks) {
    if (!tasksByProject[t.project_id]) {
      tasksByProject[t.project_id] = [];
    }
    tasksByProject[t.project_id].push(t);
  }

  for (const proj of projects) {
    proj.myTasks = tasksByProject[proj.id] || [];
    if (proj.myTasks.length > 0) {
      const done = proj.myTasks.filter(t => (t.status || '').toLowerCase() === 'done').length;
      proj.progress = Math.round((done / proj.myTasks.length) * 100);
      proj.calculated_progress = proj.progress;
    } else {
      proj.progress = proj.progress || 0;
      proj.calculated_progress = proj.progress;
    }
  }

  return projects;
}

module.exports = {
  findUserByUsername,
  findUserByName,
  findUserByEmail,
  findUserById,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserAssignedProjects
};
