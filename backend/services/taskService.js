/**
 * Task Service
 * Layer 2: Business logic — sits between validator and model
 */
const {
  fetchAllTasks,
  insertTask,
  modifyTask,
  removeTask
} = require('../models/taskModel');

async function getAllTasks() {
  return fetchAllTasks();
}

async function createTask(data) {
  const id = await insertTask(data);
  return { id, ...data };
}

async function updateTask(id, data) {
  await modifyTask(parseInt(id), data);
  return { message: 'Task updated successfully' };
}

async function deleteTask(id) {
  await removeTask(parseInt(id));
  return { message: 'Task deleted successfully' };
}

module.exports = {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask
};
