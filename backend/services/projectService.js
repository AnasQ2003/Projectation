/**
 * Project Service
 * Layer 2: Business logic — sits between validator and model
 */
const {
  fetchAllProjects,
  fetchProjectById,
  findProjectByName,
  insertProject,
  modifyProject,
  removeProject
} = require('../models/projectModel');

async function getAllProjects() {
  return fetchAllProjects();
}

async function getProjectById(id) {
  const project = await fetchProjectById(parseInt(id));
  if (!project) throw new Error('Project not found');
  return project;
}

async function createProject(data) {
  const cleanName = (data.name || '').trim();
  if (cleanName) {
    const existing = await findProjectByName(cleanName);
    if (existing) {
      throw new Error(`A project with the name "${cleanName}" already exists. Please choose a unique project name.`);
    }
  }

  const newId = await insertProject(data);
  return { id: newId, message: 'Project created successfully!' };
}

async function updateProject(id, data) {
  const projectId = parseInt(id);
  if (data.name && data.name.trim()) {
    const cleanName = data.name.trim();
    const existing = await findProjectByName(cleanName, projectId);
    if (existing) {
      throw new Error(`A project with the name "${cleanName}" already exists. Please choose a unique project name.`);
    }
  }

  await modifyProject(projectId, data);
  return { message: 'Project updated successfully' };
}

async function deleteProject(id) {
  await removeProject(parseInt(id));
  return { message: 'Project deleted successfully' };
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
