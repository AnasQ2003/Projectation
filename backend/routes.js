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
const { listNotifications, markNotificationRead, clearNotifications } = require('./controllers/notificationController');
const { listCategories } = require('./controllers/categoryController');
const { streamEvents } = require('./controllers/eventsController');
const { getProjectChartData } = require('./controllers/chartController');
const {
  listUsers,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  getMyProjectsHandler,
  getUsersProgressHandler
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
// 4. PROJECTS (Standard RESTful Routes)
// ==========================================
router.get('/projects', listProjects);
router.get('/projects/:id', getProject);
router.post('/projects', addProject);
router.put('/projects/:id', editProject);
router.delete('/projects/:id', removeProjectHandler);
// Backward compatibility aliases — specific paths MUST come before /:id wildcard
router.post('/projects/list', listProjects);
router.post('/projects/detail', getProject);
router.post('/projects/update', editProject);
router.post('/projects/delete', removeProjectHandler);
router.post('/projects/:id', editProject);

// ==========================================
// 5. MEMBERS (Standard RESTful Routes)
// ==========================================
router.get('/members', listMembers);
router.post('/members', createMember);
router.put('/members/:id', editMemberHandler);
router.delete('/members/:id', removeMemberHandler);
// Backward compatibility aliases — specific paths MUST come before /:id wildcard
router.post('/members/list', listMembers);
router.post('/members/update', editMemberHandler);
router.post('/members/delete', removeMemberHandler);
router.post('/projects/:id/members', createMember);
router.post('/members/:id', editMemberHandler);

// ==========================================
// 6. TASKS (Standard RESTful Routes)
// ==========================================
router.get('/tasks', listTasks);
router.post('/tasks', addTask);
router.put('/tasks/:id', editTask);
router.delete('/tasks/:id', removeTaskHandler);
// Backward compatibility aliases — specific paths MUST come before /:id wildcard
router.post('/tasks/list', listTasks);
router.post('/tasks/update', editTask);
router.post('/tasks/status', updateTaskStatus);
router.post('/tasks/delete', removeTaskHandler);
router.post('/projects/:id/tasks', addTask);
router.post('/tasks/:id', editTask);

// ==========================================
// 7. ACTIVITY AUDIT STREAM
// ==========================================
router.get('/activity', listActivity);
router.post('/activity', listActivity);
router.post('/activity/list', listActivity);
router.post('/activity/log', logActivity);

// ==========================================
// 8. NOTIFICATIONS & ALERTS
// ==========================================
router.get('/notifications', listNotifications);
router.post('/notifications', listNotifications);
router.post('/notifications/read', markNotificationRead);
router.post('/notifications/clear', clearNotifications);

// ==========================================
// 8b. SSE — Real-Time Event Push Stream
// ==========================================
router.get('/events/stream', streamEvents);

// ==========================================
// 8c. CHART / ANALYTICS DATA
// ==========================================
router.get('/analytics/chart', getProjectChartData);
router.post('/analytics/chart', getProjectChartData);

// ==========================================
// 9. CATEGORIES
// ==========================================
router.get('/categories', listCategories);
router.post('/categories', listCategories);
router.post('/categories/list', listCategories);

// ==========================================
// 10. USER MANAGEMENT & USER PORTAL
// ==========================================
router.get('/users', listUsers);
router.post('/users', createUserHandler);
router.put('/users/:id', updateUserHandler);
router.delete('/users/:id', deleteUserHandler);
// Backward compatibility aliases
router.post('/users/list', listUsers);
router.post('/users/create', createUserHandler);
router.post('/users/update', updateUserHandler);
router.post('/users/delete', deleteUserHandler);
router.get('/users/my-projects', getMyProjectsHandler);
router.post('/users/my-projects', getMyProjectsHandler);
router.get('/users/progress', getUsersProgressHandler);
router.post('/users/progress', getUsersProgressHandler);

module.exports = router;
