# 🚀 PROJECTATION | Enterprise Software House Sprint, Deliverables & Project Management Hub

<p align="center">
  <img src="screenshots/Screenshot%202026-10-28%20202926.png" alt="Projectation Dashboard Banner" width="90%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.12);" />
</p>

<p align="center">
  <strong>A modern, full-stack, enterprise-grade project and sprint lifecycle management platform engineered for software houses, technical leads, and engineering teams.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Backend-Node.js_%2B_Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Database-Microsoft_SQL_Server_(SSMS)-CC292B?style=for-the-badge&logo=microsoftsqlserver&logoColor=white" alt="SQL Server" />
  <img src="https://img.shields.io/badge/RealTime-Server--Sent_Events_(SSE)-0ea5e9?style=for-the-badge&logo=fastapi&logoColor=white" alt="SSE" />
  <img src="https://img.shields.io/badge/UI-Custom_Glassmorphism-2563eb?style=for-the-badge" alt="Glassmorphism" />
</p>

---

## 📑 Table of Contents
- [🌟 Architectural Highlights](#-architectural-highlights)
- [🔑 Roles & Authentication](#-roles--authentication)
- [✨ Core Capabilities](#-core-capabilities)
- [📸 Complete Screenshot Gallery (All 45 Screenshots)](#-complete-screenshot-gallery-all-45-screenshots)
  - [1. Authentication & Portals](#1-authentication--portals)
  - [2. Contributor Portal & Task Progress Engine](#2-contributor-portal--task-progress-engine)
  - [3. Executive Analytics & Matrix Table](#3-executive-analytics--matrix-table)
  - [4. Project Workspace & Kanban Sprint Board](#4-project-workspace--kanban-sprint-board)
  - [5. Interactive Modals & Workflow Management](#5-interactive-modals--workflow-management)
  - [6. Team, All Tasks & User Administration](#6-team-all-tasks--user-administration)
  - [7. Real-Time Notification Stream](#7-real-time-notification-stream)
- [🏗️ Project Architecture & File Hierarchy](#️-project-architecture--file-hierarchy)
- [🛠️ Tech Stack & Dependencies](#️-tech-stack--dependencies)
- [⚙️ Database Schema (Microsoft SQL Server)](#️-database-schema-microsoft-sql-server)
- [🚀 Quick Start & Installation Guide](#-quick-start--installation-guide)

---

## 🌟 Architectural Highlights

- **Dual-Portal Workflow**: Dedicated, custom-crafted portals for **Administrators** (Engineering Directors & PMs) and **Team Members** (Developers, QA, DevOps, Architects).
- **Strict Status-to-Progress Auto Binding**: Percentage progress is automatically calculated from deliverable statuses (`To Do` = `0%`, `In Progress` = `50%`, `Review` = `75%`, `Completed` = `100%`), eliminating data inconsistency.
- **Enterprise SQL Server Engine**: Direct integration with **Microsoft SQL Server (SSMS)** with connection pooling, automated schema verification, self-healing column migrations, and audit logging.
- **Real-Time Push System (SSE)**: Full Server-Sent Events architecture broadcasting live task state updates, status changes, and administrator review notifications without polling latency.
- **Color-Coded Deadline Alert Engine**:
  - 🟢 **Safe**: Deadline > 7 days away.
  - 🟡 **Urgent**: Deadline within 3 to 7 days.
  - 🔴 **Overdue / Due Today**: Deadline reached or exceeded, highlighted with pulsating urgency tags.

---

## 🔑 Roles & Authentication

| Role | Default Username | Default Password | Description |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin123` | Full control: create projects, assign teams, edit sprint boards, configure categories, manage system users. |
| **Team Member** | `ahmed` | `user123` | Contributor access: view personal workspaces, update deliverable statuses, log notes, live notifications. |
| **Team Member** | `sarah` | `user123` | Frontend Engineer portal. |
| **Team Member** | `david` | `user123` | Backend Specialist portal. |

---

## ✨ Core Capabilities

1. **Jira-Inspired Sprint Kanban Board**: Multi-lane board (`To Do`, `In Progress`, `In Review`, `Completed`) with inline status transitions, assignee assignments, and priority badges.
2. **Interactive Contributor Workspace**: Team member portal with personalized velocity gauges, active deliverable cards, and automated status syncing.
3. **Executive Task Velocity & Status Donut**: Live SVG Donut charts showing status distribution, priority breakdown (`Urgent`, `High`, `Medium`, `Low`), and matrix tables.
4. **Dynamic Category Filter Engine**: Create, modify, and delete custom project categories with immediate real-time filtering.
5. **Timeline & Kickoff-to-Deadline Tracker**: Project milestone duration calculations, kickoff dates, scheduled deliveries, and budget tracking in PKR.

---

## 📸 Complete Screenshot Gallery (All 45 Screenshots)

### 1. Authentication & Portals

| Screen Description | Preview |
| :--- | :--- |
| **Administrator Login Portal**<br>Dual role selection with credential validation and remember-me support. | <img src="screenshots/Screenshot%202026-10-28%20202758.png" width="700" alt="Admin Login" /> |
| **Team Member Contributor Portal**<br>Specialized green-accented authentication screen for assigned engineers. | <img src="screenshots/Screenshot%202026-10-28%20202804.png" width="700" alt="Team Member Login" /> |

---

### 2. Contributor Portal & Task Progress Engine

| Screen Description | Preview |
| :--- | :--- |
| **Contributor Workspace Overview**<br>Assigned projects, deadline count, personal velocity, and live sync progress tracker. | <img src="screenshots/Screenshot%202026-10-28%20202818.png" width="700" alt="Contributor Workspace" /> |
| **Assigned Workspaces & Deliverable Cards**<br>Deliverables list showing task status badges, due date badges, and update triggers. | <img src="screenshots/Screenshot%202026-10-28%20202823.png" width="700" alt="Assigned Workspaces" /> |
| **Update Task Progress Modal (In Progress = 50%)**<br>Auto-calculated percentage bar locked to the selected status with deliverable notes. | <img src="screenshots/Screenshot%202026-10-28%20202827.png" width="700" alt="Update Task Progress Modal In Progress" /> |
| **Update Task Progress Modal (Review = 75%)**<br>Dynamic Amber theme reflecting the 75% Review stage transition. | <img src="screenshots/Screenshot%202026-10-28%20202834.png" width="700" alt="Update Task Progress Modal Review" /> |
| **Real-Time Synchronized Task Card**<br>Task card dynamically reflects the updated status and 50% progress bar. | <img src="screenshots/Screenshot%202026-10-28%20202839.png" width="700" alt="Synchronized Task Card" /> |
| **Completed Workspaces Tab Filter**<br>Zero-state feedback view when filtering completed projects. | <img src="screenshots/Screenshot%202026-10-28%20202843.png" width="700" alt="Completed Workspaces Filter" /> |
| **Priority Filter Options in User Portal**<br>Dropdown filter by Urgent, High, Medium, or Low priority. | <img src="screenshots/Screenshot%202026-10-28%20202846.png" width="700" alt="Priority Filter Options" /> |
| **Project Velocity & Analytics Drilldown (User Portal)**<br>Task status donut chart, priority mix, and deliverable velocity breakdown. | <img src="screenshots/Screenshot%202026-10-28%20202852.png" width="700" alt="Project Analytics Drilldown User Portal" /> |
| **Matrix Table View (User Portal)**<br>Compact tabular format of sprint deliverables and stage distribution. | <img src="screenshots/Screenshot%202026-10-28%20202906.png" width="700" alt="Matrix Table View User Portal" /> |
| **Live Notifications Dropdown (Team Member)**<br>Real-time stream of task updates, progress confirmations, and admin notices. | <img src="screenshots/Screenshot%202026-10-28%20202911.png" width="700" alt="Live Notifications Team Member" /> |

---

### 3. Executive Analytics & Matrix Table

| Screen Description | Preview |
| :--- | :--- |
| **Administrator Master Dashboard**<br>Full executive workspace showing active repositories, sprint tasks, team members, and velocity. | <img src="screenshots/Screenshot%202026-10-28%20202926.png" width="700" alt="Admin Master Dashboard" /> |
| **Dashboard with Compact Collapsed Sidebar**<br>Maximized canvas layout with streamlined icon rail navigation. | <img src="screenshots/Screenshot%202026-10-28%20202932.png" width="700" alt="Dashboard Collapsed Sidebar" /> |
| **Admin Real-Time Notification Stream**<br>Instant SSE events for team member progress updates, completion alerts, and status changes. | <img src="screenshots/Screenshot%202026-10-28%20202937.png" width="700" alt="Admin Notification Stream" /> |
| **Executive Matrix Table View**<br>Complete overview of all software projects with status, velocity progress bars, and deep dive links. | <img src="screenshots/Screenshot%202026-10-28%20203017.png" width="700" alt="Executive Matrix Table View" /> |
| **Project Analytics Deep Dive Drilldown**<br>Detailed donut chart, task priority breakdown, and assignee progress for MAD App. | <img src="screenshots/Screenshot%202026-10-28%20203031.png" width="700" alt="Project Analytics Deep Dive" /> |
| **Drilldown Project Selector Dropdown**<br>One-click switching between active project analytics. | <img src="screenshots/Screenshot%202026-10-28%20203036.png" width="700" alt="Drilldown Project Selector" /> |

---

### 4. Project Workspace & Kanban Sprint Board

| Screen Description | Preview |
| :--- | :--- |
| **Project Workspace Header & Analytics (RDA)**<br>Budget allocation (PKR), team size, high priority badge, and 25-day deadline countdown. | <img src="screenshots/Screenshot%202026-10-28%20203042.png" width="700" alt="Project Workspace Header RDA" /> |
| **Sprint Board with Assigned Team Progress (RDA)**<br>4-column sprint board displaying in-progress backend deliverable. | <img src="screenshots/Screenshot%202026-10-28%20203047.png" width="700" alt="Sprint Board RDA" /> |
| **Project Workspace Full View (MAD App)**<br>Full sprint velocity header, team member progress cards, and 4 active deliverables. | <img src="screenshots/Screenshot%202026-10-28%20203056.png" width="700" alt="Project Workspace Full View MAD App" /> |
| **Kanban Sprint Board (MAD App)**<br>Complete task flow across To Do, In Progress, and In Review lanes. | <img src="screenshots/Screenshot%202026-10-28%20203100.png" width="700" alt="Kanban Sprint Board MAD App" /> |
| **Team Members Roster Tab**<br>Assigned engineers, specialist roles, email addresses, and remove actions. | <img src="screenshots/Screenshot%202026-10-28%20203105.png" width="700" alt="Team Members Roster Tab" /> |
| **Project Timeline & Milestones Roadmap**<br>Gantt-style kick-off to delivery visualization, days remaining, and sprint risk level. | <img src="screenshots/Screenshot%202026-10-28%20203110.png" width="700" alt="Project Timeline and Milestones" /> |
| **Real-Time Audit Activity Log**<br>Chronological record of status changes, completed deliverables, and engineer actions. | <img src="screenshots/Screenshot%202026-10-28%20203115.png" width="700" alt="Audit Activity Log" /> |
| **Project Velocity & Analytics Tab**<br>Comprehensive workload balance and task stage breakdown graphs inside project workspace. | <img src="screenshots/Screenshot%202026-10-28%20203119.png" width="700" alt="Project Velocity & Analytics Tab" /> |
| **All Tasks Master View**<br>Centralized filterable catalog of all deliverables across every software project. | <img src="screenshots/Screenshot%202026-10-28%20203123.png" width="700" alt="All Tasks Master View" /> |

---

### 5. Interactive Modals & Workflow Management

| Screen Description | Preview |
| :--- | :--- |
| **Manage Category Filters Modal**<br>Add new workspace categories, view project counts, edit names, or reset to defaults. | <img src="screenshots/Screenshot%202026-10-28%20203024.png" width="700" alt="Manage Category Filters Modal" /> |
| **Task Detail & Edit Modal**<br>Update task title, description, sprint column, priority, assignee, and delivery deadline. | <img src="screenshots/Screenshot%202026-10-28%20203129.png" width="700" alt="Task Detail & Edit Modal" /> |
| **Team Member Deep-Dive Analytics Modal**<br>Individual engineer profile, assigned deliverables, completion rate, and role metrics. | <img src="screenshots/Screenshot%202026-10-28%20203138.png" width="700" alt="Team Member Analytics Modal" /> |
| **Create New Project Modal (Top Section)**<br>Project title, code, category selection, and priority level. | <img src="screenshots/Screenshot%202026-10-28%20203219.png" width="700" alt="Create New Project Modal Top" /> |
| **Create New Project Modal (Bottom Section)**<br>Kickoff date, scheduled deadline, budget allocation (PKR), and project scope notes. | <img src="screenshots/Screenshot%202026-10-28%20203230.png" width="700" alt="Create New Project Modal Bottom" /> |
| **Create New Task Modal**<br>Sprint task definition with project binding, column, priority, assignee, and target deadline. | <img src="screenshots/Screenshot%202026-10-28%20203233.png" width="700" alt="Create New Task Modal" /> |
| **Add Team Member to Project Modal**<br>Select from available engineering roster and assign customized project roles. | <img src="screenshots/Screenshot%202026-10-28%20203238.png" width="700" alt="Add Team Member Modal" /> |
| **Edit Project Settings Modal**<br>Update budget, kickoff date, deadline, status, and description for existing projects. | <img src="screenshots/Screenshot%202026-10-28%20203243.png" width="700" alt="Edit Project Settings Modal" /> |
| **Category Manager Modal (from Project Settings)**<br>Manage and create categories directly while creating or editing projects. | <img src="screenshots/Screenshot%202026-10-28%20203303.png" width="700" alt="Category Manager Modal" /> |
| **Delete Project Confirmation Dialog**<br>Safety verification modal requiring explicit confirmation to prevent accidental loss. | <img src="screenshots/Screenshot%202026-10-28%20203309.png" width="700" alt="Delete Project Dialog" /> |

---

### 6. Team, All Tasks & User Administration

| Screen Description | Preview |
| :--- | :--- |
| **Team Progress & Engineering Velocity Dashboard**<br>Top-level engineering overview showing tasks completed, in-progress, and individual contribution rates. | <img src="screenshots/Screenshot%202026-10-28%20203148.png" width="700" alt="Team Progress Dashboard" /> |
| **Team Directory View**<br>Directory of all registered engineers, active project assignments, and contact details. | <img src="screenshots/Screenshot%202026-10-28%20203154.png" width="700" alt="Team Directory View" /> |
| **Sprint Roadmap & Deadlines Timeline View**<br>Comprehensive multi-project milestone timeline with deadline badges and progress bars. | <img src="screenshots/Screenshot%202026-10-28%20203159.png" width="700" alt="Sprint Roadmap Timeline View" /> |
| **User Management Administration (Admin)**<br>Manage system logins, roles (Super Admin / Team Member), and add new team accounts. | <img src="screenshots/Screenshot%202026-10-28%20203204.png" width="700" alt="User Management Administration" /> |
| **Add New System User Form**<br>Form to create new team member credentials, assign initial roles, and configure access. | <img src="screenshots/Screenshot%202026-10-28%20203209.png" width="700" alt="Add New User Form" /> |
| **Filtered Task View (By Project)**<br>All Tasks view filtered specifically to the MAD App repository. | <img src="screenshots/Screenshot%202026-10-28%20203214.png" width="700" alt="Filtered Task View" /> |
| **Quick Task Status Switcher in All Tasks View**<br>Direct inline dropdown update of task statuses from the master list. | <img src="screenshots/Screenshot%202026-10-28%20203249.png" width="700" alt="Quick Status Switcher" /> |
| **Task Status Transition to In Progress**<br>Instant status update reflected in the All Tasks view with live notification broadcast. | <img src="screenshots/Screenshot%202026-10-28%20203252.png" width="700" alt="Task Status In Progress" /> |

---

### 7. Real-Time Notification Stream

| Screen Description | Preview |
| :--- | :--- |
| **Real-Time Notification Center (Admin)**<br>Dropdown stream showing notifications for task completions, status changes, and priority tags. | <img src="screenshots/Screenshot%202026-10-28%20202937.png" width="700" alt="Admin Notification Stream Preview" /> |
| **Team Member Instant Confirmation Alert**<br>Real-time confirmation delivered directly to the assigned contributor's notification bell. | <img src="screenshots/Screenshot%202026-10-28%20202911.png" width="700" alt="Team Member Alert Preview" /> |

---

## 🏗️ Project Architecture & File Hierarchy

```text
Projectation/
├── backend/
│   ├── controllers/
│   │   ├── authController.js          # Authentication & token verification
│   │   ├── chartController.js         # Velocity, progress charts & analytics data
│   │   ├── memberController.js        # Team member assignments & allocations
│   │   ├── notificationController.js  # DB notifications & SSE real-time streaming
│   │   ├── projectController.js       # Projects CRUD, budget, & status management
│   │   ├── systemController.js        # Health check & database verification
│   │   ├── taskController.js          # Sprint tasks, status transitions & notes
│   │   └── userController.js          # User management & contributor registration
│   ├── models/
│   │   ├── memberModel.js             # Members database queries
│   │   ├── projectModel.js            # Projects database queries
│   │   ├── taskModel.js               # Tasks & progress auto-calculation queries
│   │   └── userModel.js               # Users database queries
│   ├── validators/
│   │   ├── projectValidator.js        # Request payload validators
│   │   └── taskValidator.js           # Task validation rules
│   ├── db.js                          # MS SQL Server pool, schema auto-migration, seed data
│   ├── routes.js                      # Express API route declarations
│   ├── server.js                      # Express HTTP server & SSE endpoints
│   └── package.json                   # Backend dependencies (mssql, express, cors, dotenv)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CategoryManagerModal.jsx         # Custom categories management modal
│   │   │   ├── EditProjectSettingsModal.jsx     # Edit project parameters modal
│   │   │   ├── LoginScreen.jsx                  # Dual-portal login interface
│   │   │   ├── MemberDetailModal.jsx            # Contributor analytics drilldown modal
│   │   │   ├── Navbar.jsx                       # Top navigation, search & notifications bell
│   │   │   ├── NewMemberModal.jsx               # Assign team member modal
│   │   │   ├── NewProjectModal.jsx              # Create project modal
│   │   │   ├── NewTaskModal.jsx                 # Create sprint task modal
│   │   │   ├── NotificationDropdown.jsx         # Real-time SSE alert dropdown
│   │   │   ├── ProjectCard.jsx                  # Project card with deadline countdown
│   │   │   ├── ProjectDetail.jsx                # Full project workspace & Kanban board
│   │   │   ├── ProjectMemberAnalyticsGraph.jsx  # Member workload & velocity SVG donuts
│   │   │   ├── ProjectProgressChart.jsx         # Sprint status breakdown & velocity matrix
│   │   │   ├── Sidebar.jsx                      # Collapsible left navigation drawer
│   │   │   ├── SplashLogo.jsx                   # Loading splash screen with glowing logo
│   │   │   ├── TaskDetailModal.jsx              # Edit task details modal
│   │   │   ├── UserManagementModal.jsx          # Register user modal
│   │   │   ├── UserPortalView.jsx               # Dedicated Team Member Contributor Portal
│   │   │   └── UserProgressTracker.jsx          # Team velocity & contribution tracker
│   │   ├── pages/
│   │   │   ├── AllTasksView.jsx                 # Master catalog of all project deliverables
│   │   │   ├── Dashboard.jsx                    # Executive dashboard with projects grid
│   │   │   ├── RoadmapTimelineView.jsx          # Gantt-style roadmap timeline
│   │   │   ├── TeamProgressView.jsx             # Top-level engineering progress view
│   │   │   ├── TeamView.jsx                     # Engineering team roster directory
│   │   │   └── UserManagementView.jsx           # System user accounts administration
│   │   ├── services/
│   │   │   └── api.js                           # Frontend REST API service client
│   │   ├── utils/
│   │   │   └── dateUtils.js                     # Deadline calculation & color indicators
│   │   ├── App.jsx                              # Main app root & state controller
│   │   ├── index.css                            # Glassmorphism tokens & styling
│   │   └── main.jsx                             # React DOM entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── screenshots/                                 # Complete 45 screenshot suite
└── README.md
```

---

## 🛠️ Tech Stack & Dependencies

### Frontend
- **React 18 / 19** with **Vite**: Ultra-fast build and development server.
- **Lucide React**: Modern, scalable icon library.
- **Modern Glassmorphic CSS**: Clean radial mesh backgrounds, frosted surfaces, and translucent borders.
- **EventSource API**: Native browser SSE subscription for instant real-time alerts.

### Backend
- **Node.js & Express.js**: RESTful API endpoints and streaming event emitter.
- **mssql**: Official Microsoft SQL Server client for Node.js with connection pooling.
- **CORS & Dotenv**: Environment management and secure cross-origin requests.

### Database
- **Microsoft SQL Server (SSMS)**: Enterprise relational database with automated schema synchronization and activity logging.

---

## ⚙️ Database Schema (Microsoft SQL Server)

The database schema is automatically verified and created by `backend/db.js` upon server startup:

```sql
-- 1. Projects Table
CREATE TABLE Projects (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(255) NOT NULL,
  code NVARCHAR(50) NOT NULL UNIQUE,
  category NVARCHAR(100) DEFAULT 'General',
  priority NVARCHAR(50) DEFAULT 'Medium',
  kickoff_date NVARCHAR(50),
  deadline NVARCHAR(50) NOT NULL,
  budget NVARCHAR(100) DEFAULT 'PKR 0',
  description NVARCHAR(MAX),
  progress INT DEFAULT 0,
  created_at DATETIME DEFAULT GETDATE()
);

-- 2. Tasks Table (with Auto-calculated Progress)
CREATE TABLE Tasks (
  id INT IDENTITY(1,1) PRIMARY KEY,
  project_id INT NOT NULL FOREIGN KEY REFERENCES Projects(id) ON DELETE CASCADE,
  title NVARCHAR(255) NOT NULL,
  description NVARCHAR(MAX),
  status NVARCHAR(50) DEFAULT 'todo',
  priority NVARCHAR(50) DEFAULT 'Medium',
  assignee NVARCHAR(100) DEFAULT 'Unassigned',
  due_date NVARCHAR(50),
  completed_at NVARCHAR(50),
  progress_percent INT DEFAULT 0,
  progress_note NVARCHAR(MAX),
  updated_by NVARCHAR(100),
  created_at DATETIME DEFAULT GETDATE()
);

-- 3. Users Table (Role-Based Authentication)
CREATE TABLE Users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  username NVARCHAR(100) NOT NULL UNIQUE,
  password NVARCHAR(255) NOT NULL,
  name NVARCHAR(150) NOT NULL,
  role NVARCHAR(50) DEFAULT 'Team Member',
  email NVARCHAR(150),
  created_at DATETIME DEFAULT GETDATE()
);

-- 4. Members Table (Project-Specific Assignments)
CREATE TABLE Members (
  id INT IDENTITY(1,1) PRIMARY KEY,
  project_id INT NOT NULL FOREIGN KEY REFERENCES Projects(id) ON DELETE CASCADE,
  name NVARCHAR(150) NOT NULL,
  role NVARCHAR(100) DEFAULT 'Developer',
  color NVARCHAR(50) DEFAULT '#2563eb',
  created_at DATETIME DEFAULT GETDATE()
);

-- 5. Notifications Table (SSE Real-time Events)
CREATE TABLE Notifications (
  id INT IDENTITY(1,1) PRIMARY KEY,
  target_role NVARCHAR(50) DEFAULT 'All',
  target_user NVARCHAR(100) NULL,
  type NVARCHAR(50) NOT NULL,
  title NVARCHAR(255) NOT NULL,
  message NVARCHAR(MAX) NOT NULL,
  priority NVARCHAR(50) DEFAULT 'Medium',
  link_id INT NULL,
  is_read BIT DEFAULT 0,
  created_at DATETIME DEFAULT GETDATE()
);

-- 6. Activity Logs Table
CREATE TABLE ActivityLogs (
  id INT IDENTITY(1,1) PRIMARY KEY,
  project_id INT NOT NULL FOREIGN KEY REFERENCES Projects(id) ON DELETE CASCADE,
  action NVARCHAR(MAX) NOT NULL,
  [user] NVARCHAR(100) DEFAULT 'System',
  created_at DATETIME DEFAULT GETDATE()
);
```

---

## 🚀 Quick Start & Installation Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Microsoft SQL Server & SSMS](https://www.microsoft.com/en-us/sql-server) installed and running locally.

### 1. Database Configuration
Ensure Microsoft SQL Server is running. The application connects using Windows Authentication or SQL Server authentication. Configure your credentials in `backend/.env` (or use defaults in `backend/db.js`):

```env
DB_SERVER=localhost
DB_NAME=ProjectationDB
PORT=5000
```
*Note: On first startup, the backend automatically initializes `ProjectationDB`, creates all required tables, and seeds initial demo projects, users, and sprint tasks.*

### 2. Start Backend API
Open a terminal in the project directory:
```bash
cd backend
npm install
npm start
```
*Backend runs on: `http://localhost:5000`*

### 3. Start Frontend Client
Open a second terminal in the project directory:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

### 4. Build for Production
```bash
cd frontend
npm run build
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
