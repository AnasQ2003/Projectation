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
// 3. STATS (POST + GET)
// ==========================================
router.post('/stats', getStats);
router.get('/stats',  getStats);

// ==========================================
// 4. PROJECTS (POST-first architecture)
// ==========================================
router.post('/projects/list',   listProjects);          // list all via POST
router.post('/projects/detail', getProject);            // get single via POST ({ id })
router.get('/projects',         listProjects);          // list all fallback
router.get('/projects/:id',     getProject);            // get single fallback
router.post('/projects',        addProject);            // create
router.post('/projects/update', editProject);           // update (POST instead of PUT)
router.post('/projects/:id',    editProject);           // update fallback
router.put('/projects/:id',     editProject);           // legacy alias
router.post('/projects/delete', removeProjectHandler);  // delete (POST instead of DELETE)

// ==========================================
// 5. MEMBERS (POST-first architecture)
// ==========================================
router.post('/members/list',              listMembers);          // list all via POST
router.get('/members',                    listMembers);          // list all fallback
router.post('/members',                   createMember);         // create (with project_id in body)
router.post('/projects/:id/members',      createMember);         // create (project_id from URL)
router.post('/members/delete',            removeMemberHandler);  // delete (POST instead of DELETE)

// ==========================================
// 6. TASKS (POST-first architecture)
// ==========================================
router.post('/tasks/list',                listTasks);            // list all via POST
router.get('/tasks',                      listTasks);            // list all fallback
router.post('/tasks',                     addTask);              // create (project_id in body)
router.post('/projects/:id/tasks',        addTask);              // create (project_id from URL)
router.post('/tasks/update',              editTask);             // update (POST instead of PUT)
router.post('/tasks/:id',                 editTask);             // update fallback
router.put('/tasks/:id',                  editTask);             // legacy alias
router.post('/tasks/delete',              removeTaskHandler);    // delete (POST instead of DELETE)

module.exports = router;
