const { validateLogin } = require('../validators/authValidator');
const { loginUser } = require('../services/authService');
const { decryptTransportPayload } = require('../utils/crypto');

async function login(req, res) {
  // Handle encrypted transport payload if not unpacked yet
  if (req.body && (req.body._encrypted || req.body.encrypted) && req.body.payload) {
    try {
      req.body = decryptTransportPayload(req.body.payload);
    } catch {
      return res.status(400).json({ error: 'Malformed authentication payload' });
    }
  }

  // 1. Validate inputs
  const errors = validateLogin(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], errors });
  }

  const { username, password } = req.body;

  try {
    // 2. Business logic via service — returns { user, token }
    const { user, token } = await loginUser(username, password);

    // 3. Return safe response (no sensitive data — token is a signed JWT)
    return res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (err) {
    // Mask internal errors — only return generic auth failure
    return res.status(401).json({ error: 'Invalid login credentials!' });
  }
}

module.exports = { login };
