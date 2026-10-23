const express = require('express');
const router = express.Router();

// Controllers
const { login, verify, profile } = require('./controllers/authController');
const { ping, getHealth, getAllNamesDirectory } = require('./controllers/systemController');
const { getStats } = require('./controllers/statsController');
const { getSummary: getAnalyticsSummary } = require('./controllers/analyticsController');
const { listProjects, getProject, addProject, editProject, removeProjectHandler } = require('./controllers/projectController');
const { listMembers, createMember, editMemberHandler, removeMemberHandler } = require('./controllers/memberController');
const { listTasks, addTask, editTask, updateTaskStatus, removeTaskHandler } = require('./controllers/taskController');
const { listActivity, logActivity } = require('./controllers/activityController');
const { listNotifications } = require('./controllers/notificationController');
const { listCategories } = require('./controllers/categoryController');
const {
  listUsers,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  getMyProjectsHandler
} = require('./controllers/userController');

// ==========================================
// 1. SYSTEM & HEALTH (Instant POST Handshakes)
// ==========================================
router.post('/system/ping', ping);
router.get('/system/ping', ping);
router.post('/system/health', getHealth);
router.get('/system/health', getHealth);
router.get('/health', getHealth); // legacy alias
router.post('/system/names', getAllNamesDirectory);
router.get('/system/names', getAllNamesDirectory);
router.post('/names/all', getAllNamesDirectory);
router.get('/names/all', getAllNamesDirectory);

// ==========================================
// 2. AUTHENTICATION & SESSION
// ==========================================
router.post('/auth/login', login);
router.post('/auth/verify', verify);
router.post('/auth/profile', profile);

// ==========================================
// 3. STATS & ANALYTICS
// ==========================================
router.post('/stats', getStats);
router.get('/stats', getStats);
router.post('/analytics/summary', getAnalyticsSummary);

// ==========================================
// 4. PROJECTS (POST-first architecture)
// ==========================================
router.post('/projects/list', listProjects);
router.post('/projects/detail', getProject);
router.get('/projects', listProjects);
router.get('/projects/:id', getProject);
router.post('/projects', addProject);
router.post('/projects/update', editProject);
router.post('/projects/:id', editProject);
router.put('/projects/:id', editProject);
router.post('/projects/delete', removeProjectHandler);

// ==========================================
// 5. MEMBERS (POST-first architecture)
// ==========================================
router.post('/members/list', listMembers);
router.get('/members', listMembers);
router.post('/members', createMember);
router.post('/projects/:id/members', createMember);
router.post('/members/update', editMemberHandler);
router.post('/members/:id', editMemberHandler);
router.put('/members/:id', editMemberHandler);
router.post('/members/delete', removeMemberHandler);

// ==========================================
// 6. TASKS (POST-first architecture)
// ==========================================
router.post('/tasks/list', listTasks);
router.get('/tasks', listTasks);
router.post('/tasks', addTask);
router.post('/projects/:id/tasks', addTask);
router.post('/tasks/update', editTask);
router.post('/tasks/status', updateTaskStatus);
router.post('/tasks/:id', editTask);
router.put('/tasks/:id', editTask);
router.post('/tasks/delete', removeTaskHandler);

// ==========================================
// 7. ACTIVITY AUDIT STREAM
// ==========================================
router.post('/activity/list', listActivity);
router.post('/activity/log', logActivity);

// ==========================================
// 8. NOTIFICATIONS & ALERTS
// ==========================================
router.post('/notifications', listNotifications);

// ==========================================
// 9. CATEGORIES
// ==========================================
router.post('/categories/list', listCategories);
router.get('/categories', listCategories);

// ==========================================
// 10. USER MANAGEMENT & USER PORTAL (POST-first)
// ==========================================
router.post('/users/list', listUsers);
router.post('/users/create', createUserHandler);
router.post('/users/update', updateUserHandler);
router.post('/users/delete', deleteUserHandler);
router.post('/users/my-projects', getMyProjectsHandler);

module.exports = router;
