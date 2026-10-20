/**
 * routes.js — API Router (Layer 4)
 * 
 * Architecture Flow:
 *   Request → Validator → Service → Model → Controller → Router (here) → Module (server.js)
 *
 * Policy: Only GET (reads) and POST (writes/deletes/updates) are used.
 *         PUT and DELETE verbs are not exposed.
 */

const express = require('express');
const router = express.Router();

// Controllers (Layer 3)
const { login }                                   = require('./controllers/authController');
const { getStats }                                = require('./controllers/statsController');
const { listProjects, getProject, addProject, editProject, removeProjectHandler } = require('./controllers/projectController');
const { listMembers, createMember, removeMemberHandler }                          = require('./controllers/memberController');
const { listTasks, addTask, editTask, removeTaskHandler }                         = require('./controllers/taskController');

// ==========================================
// 1. HEALTH CHECK
// ==========================================
router.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'Projectation API (MSSQL)', timestamp: new Date() });
});

// ==========================================
// 2. AUTH
// ==========================================
router.post('/auth/login', login);

// ==========================================
// 3. STATS
// ==========================================
router.get('/stats', getStats);

// ==========================================
// 4. PROJECTS
// ==========================================
router.get('/projects',         listProjects);       // list all
router.get('/projects/:id',     getProject);         // get single
router.post('/projects',        addProject);         // create
router.post('/projects/update', editProject);        // update  (POST instead of PUT)
router.post('/projects/delete', removeProjectHandler); // delete  (POST instead of DELETE)

// ==========================================
// 5. MEMBERS
// ==========================================
router.get('/members',                    listMembers);          // list all
router.post('/members',                   createMember);         // create (with project_id in body)
router.post('/projects/:id/members',      createMember);         // create (project_id from URL)
router.post('/members/delete',            removeMemberHandler);  // delete (POST instead of DELETE)

// ==========================================
// 6. TASKS
// ==========================================
router.get('/tasks',                  listTasks);              // list all
router.post('/tasks',                 addTask);                // create (project_id in body)
router.post('/projects/:id/tasks',    addTask);                // create (project_id from URL)
router.post('/tasks/update',          editTask);               // update (POST instead of PUT)
router.post('/tasks/delete',          removeTaskHandler);      // delete (POST instead of DELETE)

module.exports = router;
