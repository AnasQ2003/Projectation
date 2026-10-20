/**
 * Member Controller
 * Layer 3: HTTP request/response handling
 * Flow: Validator → Service → Model → Controller → Router → Module (server.js)
 */
const {
  validateCreateMember,
  validateMemberId
} = require('../validators/memberValidator');

const {
  getAllMembers,
  addMember,
  deleteMember
} = require('../services/memberService');

// GET /api/members
async function listMembers(req, res) {
  try {
    const members = await getAllMembers();
    return res.json(members);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch members' });
  }
}

// POST /api/members  or  POST /api/projects/:id/members
async function createMember(req, res) {
  // Support project_id from URL param or body
  const project_id = req.params.id || req.body.project_id;
  const data = { ...req.body, project_id };

  const errors = validateCreateMember(data);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], errors });
  }

  try {
    const member = await addMember(data);
    return res.status(201).json(member);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add member' });
  }
}

// POST /api/members/delete  (replaces DELETE /api/members/:id)
async function removeMemberHandler(req, res) {
  const id = req.body.id || req.params.id;

  const idErrors = validateMemberId({ id });
  if (idErrors.length > 0) {
    return res.status(400).json({ error: idErrors[0], errors: idErrors });
  }

  try {
    const result = await deleteMember(id);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to remove member' });
  }
}

module.exports = {
  listMembers,
  createMember,
  removeMemberHandler
};
