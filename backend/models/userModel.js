const { executeQuery } = require('../db');

/**
 * Find user by username (supports admin/anas alias)
 */
async function findUserByUsername(username) {
  const cleanUser = username.trim().toLowerCase();
  const result = await executeQuery(
    `SELECT * FROM Users WHERE LOWER(username) = @u OR (LOWER(username) = 'anas' AND @u = 'admin') OR (LOWER(username) = 'admin' AND @u = 'anas')`,
    { u: cleanUser }
  );
  return result.recordset[0] || null;
}

module.exports = {
  findUserByUsername
};
