<div align="center">
  
#  🚀 PROJECTATION
### Enterprise Software House Sprint, Deliverables & Project Management Hub

<p align="center">
  <strong>A modern, full-stack, enterprise-grade project and sprint lifecycle management platform engineered for software houses, technical leads, and engineering teams.</strong>
</p>

### 🌐 [**Live Demo → projectation.vercel.app**](https://projectation-sprint-hub-492.netlify.app/)

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Backend-Node.js_%2B_Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Database-Microsoft_SQL_Server_(SSMS)-CC292B?style=for-the-badge&logo=microsoftsqlserver&logoColor=white" alt="SQL Server" />
  <img src="https://img.shields.io/badge/RealTime-Server--Sent_Events_(SSE)-0ea5e9?style=for-the-badge&logo=fastapi&logoColor=white" alt="SSE" />
  <img src="https://img.shields.io/badge/UI-Custom_Glassmorphism-2563eb?style=for-the-badge" alt="Glassmorphism" />
</p>

</div>

---

## 📑 Table of Contents
- [🌟 Architectural Highlights](#-architectural-highlights)
- [🔑 Roles & Authentication](#-roles--authentication)
- [✨ Core Capabilities](#-core-capabilities)
- [📸 Screenshots](#-screenshots)
  - [1. Authentication & Portals](#1-authentication--portals)
  - [2. Team Member Contributor Portal & Task Progress Engine](#2-team-member-contributor-portal--task-progress-engine)
  - [3. Executive Analytics & Management Dashboard](#3-executive-analytics--management-dashboard)
  - [4. Project Workspaces & Sprint Kanban Boards](#4-project-workspaces--sprint-kanban-boards)
  - [5. Team Progress, All Tasks & User Administration](#5-team-progress-all-tasks--user-administration)
  - [6. Modals & Project Configuration](#6-modals--project-configuration)
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

| Role | Default Username + Password | Description |
| :--- | :--- | :--- |
| **Super Admin** | `admin` + `admin123`| Full control: create projects, assign teams, edit sprint boards, configure categories, manage system users. |
| **Team Member** | `ahmed` + `user123`| Contributor access: view personal workspaces, update deliverable statuses, log notes, live notifications. |
| **Team Member** | `sarah` + `user123` | Frontend Engineer portal. |
| **Team Member** | `david` + `user123`| Backend Specialist portal. |

---

## ✨ Core Capabilities

1. **Jira-Inspired Sprint Kanban Board**: Multi-lane board (`To Do`, `In Progress`, `In Review`, `Completed`) with inline status transitions, assignee assignments, and priority badges.
2. **Interactive Contributor Workspace**: Team member portal with personalized velocity gauges, active deliverable cards, and automated status syncing.
3. **Executive Task Velocity & Status Donut**: Live SVG Donut charts showing status distribution, priority breakdown (`Urgent`, `High`, `Medium`, `Low`), and matrix tables.
4. **Dynamic Category Filter Engine**: Create, modify, and delete custom project categories with immediate real-time filtering.
5. **Timeline & Kickoff-to-Deadline Tracker**: Project milestone duration calculations, kickoff dates, scheduled deliveries, and budget tracking in PKR.

---

## 📸 Screenshots

### 1. Authentication & Portals

![](screenshots/Screenshot%202026-10-28%20202758.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20202804.png)

---

### 2. Team Member Contributor Portal & Task Progress Engine

![](screenshots/Screenshot%202026-10-28%20202818.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20202823.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20202827.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20202834.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20202839.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20202843.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20202846.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20202852.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20202906.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20202911.png)

---

### 3. Executive Analytics & Management Dashboard

![](screenshots/Screenshot%202026-10-28%20202926.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20202932.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20202937.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203017.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203031.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203036.png)

---

### 4. Project Workspaces & Sprint Kanban Boards

![](screenshots/Screenshot%202026-10-28%20203042.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203047.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203056.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203100.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203105.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203110.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203115.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203119.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203123.png)

---

### 5. Team Progress, All Tasks & User Administration

![](screenshots/Screenshot%202026-10-28%20203148.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203154.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203159.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203204.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203209.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203214.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203249.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203252.png)

---

### 6. Modals & Project Configuration

![](screenshots/Screenshot%202026-10-28%20203024.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203129.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203138.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203219.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203230.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203233.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203238.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203243.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203303.png)

<br/>

![](screenshots/Screenshot%202026-10-28%20203309.png)

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
Ensure Microsoft SQL Server is running. Configure your credentials in `backend/.env` (or use defaults in `backend/db.js`):

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

```
MIT License

Copyright (c) Projectation --- 2026 AnasQ2003🚀

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 👨‍💻 Author

**Anas Ahmed Qureshi.** — [@AnasQ2003](https://github.com/AnasQ2003)

---

<div align="center">
  <p>Built with ❤️ by <strong>Anas</strong></p>
  
 <div align="center">

Made with 🔥 and a lot of ☕
