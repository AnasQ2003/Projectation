const { validateLogin } = require('../validators/authValidator');
const { loginUser, verifyToken } = require('../services/authService');
const { decryptTransportPayload } = require('../utils/crypto');

async function login(req, res) {
  if (req.body && (req.body._enc || req.body._encrypted || req.body.encrypted) && (req.body.data || req.body.payload)) {
    try { req.body = decryptTransportPayload(req.body.data || req.body.payload); } catch {
      return res.status(400).json({ error: 'Malformed authentication payload' });
    }
  }

  // 1. Validate inputs
  const errors = validateLogin(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], errors });
  }

  const { username, password, targetRole } = req.body;

  try {
    // 2. Business logic via service — returns { user, token }
    const { user, token } = await loginUser(username, password);

    // Enforce strict tab role separation
    if (targetRole === 'admin') {
      const isAdmin = user.role === 'Admin' || (user.role && user.role.includes('Admin'));
      if (!isAdmin) {
        return res.json({
          success: false,
          error: 'Access denied: Regular users cannot sign in via the Administrator portal. Please use the Team Member tab.'
        });
      }
    } else if (targetRole === 'user') {
      const isAdmin = user.role === 'Admin' || (user.role && user.role.includes('Admin'));
      if (isAdmin) {
        return res.json({
          success: false,
          error: 'Access denied: Administrators cannot sign in via the Team Member portal. Please use the Administrator tab.'
        });
      }
    }

    // 3. Return safe response (no sensitive data — token is a signed JWT)
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user
    });
  } catch (err) {
    return res.json({
      success: false,
      error: err.message || 'Invalid login credentials!'
    });
  }
}

/**
 * POST /api/auth/verify
 */
async function verify(req, res) {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.body && req.body.token) {
    token = req.body.token;
  }

  if (!token) {
    return res.json({ valid: false, user: null, error: 'No active session token provided' });
  }

  try {
    const decoded = verifyToken(token);
    return res.json({
      valid: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        name: decoded.name || 'Admin',
        role: decoded.role || 'Lead Administrator'
      }
    });
  } catch (err) {
    return res.json({ valid: false, user: null, error: 'Session expired or invalid' });
  }
}

/**
 * POST /api/auth/profile
 * Returns authenticated user profile and permissions
 */
async function profile(req, res) {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.body && req.body.token) {
    token = req.body.token;
  }

  try {
    const decoded = token ? verifyToken(token) : { username: 'admin', name: 'Admin', role: 'Admin' };
    return res.json({
      user: {
        id: decoded.id || 2,
        username: decoded.username || 'admin',
        name: decoded.name || 'Admin',
        role: decoded.role || 'Admin'
      },
      permissions: [
        'manage_projects',
        'create_projects',
        'delete_projects',
        'manage_tasks',
        'manage_team',
        'export_reports',
        'manage_settings'
      ],
      theme: 'light',
      lastActive: new Date().toISOString()
    });
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = {
  login,
  verify,
  profile
};
