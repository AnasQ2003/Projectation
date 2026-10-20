/**
 * Auth Controller
 * Layer 3: HTTP request/response handling
 * Flow: Validator → Service → Model → Controller → Router → Module (server.js)
 */
const { validateLogin } = require('../validators/authValidator');
const { loginUser } = require('../services/authService');

async function login(req, res) {
  // 1. Validate inputs
  const errors = validateLogin(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], errors });
  }

  const { username, password } = req.body;

  try {
    // 2. Business logic via service
    const user = await loginUser(username, password);

    // 3. Return safe response (no sensitive data)
    return res.json({
      message: 'Login successful',
      token: 'admin-auth-token-secure-session',
      user
    });
  } catch (err) {
    // Mask internal errors — only return generic auth failure
    return res.status(401).json({ error: 'Invalid login credentials!' });
  }
}

module.exports = { login };
