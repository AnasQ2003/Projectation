/**
 * Project Service
 * Layer 2: Business logic — sits between validator and model
 */
const {
  fetchAllProjects,
  fetchProjectById,
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
  const newId = await insertProject(data);
  return { id: newId, message: 'Project created successfully!' };
}

async function updateProject(id, data) {
  await modifyProject(parseInt(id), data);
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
