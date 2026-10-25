const {
  validateCreateMember,
  validateUpdateMember,
  validateMemberId
} = require('../validators/memberValidator');

const {
  getAllMembers,
  addMember,
  updateMember,
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
    return res.status(400).json({ error: err.message || 'Failed to add member' });
  }
}

// POST /api/members/update or POST /api/members/:id
async function editMemberHandler(req, res) {
  const { id: bodyId, ...updateData } = req.body;
  const id = bodyId || req.params.id;

  const idErrors = validateMemberId({ id });
  if (idErrors.length > 0) {
    return res.status(400).json({ error: idErrors[0], errors: idErrors });
  }

  const bodyErrors = validateUpdateMember(updateData);
  if (bodyErrors.length > 0) {
    return res.status(400).json({ error: bodyErrors[0], errors: bodyErrors });
  }

  try {
    const result = await updateMember(id, updateData);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to update member' });
  }
}

// POST /api/members/delete  (replaces DELETE /api/members/:id)
async function removeMemberHandler(req, res) {
  // Express 5 / router package compat: params may be undefined on DELETE; fall back to URL
  const urlId = (req.path || req.url || '').split('/').filter(Boolean).pop();
  const id = req.params?.id || req.body?.id || (urlId && urlId !== 'delete' ? urlId : undefined);

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
  editMemberHandler,
  removeMemberHandler
};
