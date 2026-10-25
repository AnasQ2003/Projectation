const {
  validateCreateProject,
  validateUpdateProject,
  validateProjectId
} = require('../validators/projectValidator');

const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} = require('../services/projectService');

// GET /api/projects
async function listProjects(req, res) {
  try {
    const projects = await getAllProjects();
    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
}

// GET /api/projects/:id or POST /api/projects/detail
async function getProject(req, res) {
  const id = req.params.id || req.body.id;
  const idErrors = validateProjectId({ id });
  if (idErrors.length > 0) {
    return res.status(400).json({ error: idErrors[0], errors: idErrors });
  }

  try {
    const project = await getProjectById(id);
    return res.json(project);
  } catch (err) {
    if (err.message === 'Project not found') {
      return res.status(404).json({ error: 'Project not found' });
    }
    return res.status(500).json({ error: 'Failed to fetch project' });
  }
}

// POST /api/projects
async function addProject(req, res) {
  const errors = validateCreateProject(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], errors });
  }

  try {
    const result = await createProject(req.body);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create project' });
  }
}

// POST /api/projects/update  (replaces PUT /api/projects/:id)
async function editProject(req, res) {
  const { id: bodyId, ...updateData } = req.body;
  const id = bodyId || req.params.id;

  const idErrors = validateProjectId({ id });
  if (idErrors.length > 0) {
    return res.status(400).json({ error: idErrors[0], errors: idErrors });
  }

  const bodyErrors = validateUpdateProject(updateData);
  if (bodyErrors.length > 0) {
    return res.status(400).json({ error: bodyErrors[0], errors: bodyErrors });
  }

  try {
    const result = await updateProject(id, updateData);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update project' });
  }
}

// POST /api/projects/delete  (replaces DELETE /api/projects/:id)
async function removeProjectHandler(req, res) {
  // Express 5 / router package compat: params may be undefined on DELETE; fall back to URL
  const urlId = (req.path || req.url || '').split('/').filter(Boolean).pop();
  const id = req.params?.id || req.body?.id || (urlId && urlId !== 'delete' ? urlId : undefined);

  const idErrors = validateProjectId({ id });
  if (idErrors.length > 0) {
    return res.status(400).json({ error: idErrors[0], errors: idErrors });
  }

  try {
    const result = await deleteProject(id);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete project' });
  }
}

module.exports = {
  listProjects,
  getProject,
  addProject,
  editProject,
  removeProjectHandler
};
