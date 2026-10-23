#  PROJECTATION | Software House Project & Sprint Hub

A full-stack project management application with a **React.js** frontend, **Node.js (Express)** backend, and a **SQL (SQLite)** database.

---

## 📁 Clean & Simple Folder Structure

```text
Projectation/
├── backend/                  # Node.js & Express REST API
│   ├── db.js                 # Pure SQL Database schema, tables & seed data (SQLite)
│   ├── server.js             # Express server & API endpoints
│   ├── package.json          # Backend dependencies (express, cors, sqlite3)
│   └── projectation.db       # SQLite database file (auto-generated)
│
└── frontend/                 # React.js SPA (Vite)
    ├── src/
    │   ├── components/
    │   │   ├── SplashLogo.jsx       # 1. Loading splash screen with glowing logo
    │   │   ├── LoginScreen.jsx      # 2. Admin portal with 1-click demo autofill
    │   │   ├── Sidebar.jsx          # 3. Left drawer navigation with collapse/expand
    │   │   ├── Navbar.jsx           # 4. Search, Dark/Light theme toggle & Top-Right Logout
    │   │   ├── ProjectCard.jsx      # 5. Project card with color-coded deadline badges
    │   │   ├── ProjectDetail.jsx    # 6. Detailed workspace (Jira Sprint Board, Team, Timeline)
    │   │   ├── NewProjectModal.jsx  # 7. Modal to create unlimited projects
    │   │   ├── NewTaskModal.jsx     # 8. Modal to create tasks with assignees & due dates
    │   │   └── NewMemberModal.jsx   # 9. Modal to add engineering members
    │   ├── pages/
    │   │   └── Dashboard.jsx        # Project hub with live stats, search, & urgency filters
    │   ├── services/
    │   │   └── api.js               # Clean backend REST API client
    │   ├── utils/
    │   │   └── dateUtils.js         # Deadline calculation & color indicators
    │   ├── App.jsx                  # Main view state & routing controller
    │   └── index.css                # Modern CSS design tokens, glassmorphism & dark theme
    ├── index.html
    └── package.json
```

---

## 🔑 Admin Credentials (Single User Admin)

| Username | Password | Role |
| :--- | :--- | :--- |
| `admin` | `admin123` | Head of Engineering & Super Admin |

*Tip: On the login screen, click the **"Auto-fill"** chip to quickly populate the demo credentials!*

---

## 🎨 Key Features Implemented

1. **Splash Logo Intro**: When the app starts, an animated glowing Projectation logo appears with a loading progress bar before transitioning to the login screen.
2. **Admin Portal**: Authentication screen with single-admin privilege, password reveal toggle, and one-click demo credentials.
3. **Left Drawer Navigation**: Collapsible drawer on the left side with smooth transitions and status indicator.
4. **Top Right Logout & Dark/Light Theme**: Theme switcher button toggleable between sleek dark mode (default) and clean light mode, with an icon-based **Logout** button on the top right.
5. **Color-Coded Deadline Indicators**:
   - 🟢 **Green (Safe)**: Deadline is more than 7 days away.
   - 🟡 **Yellow / Amber (Urgent)**: Deadline is within 3 days.
   - 🔴 **Red (Danger / Overdue / Due Today)**: Deadline is today or overdue.
6. **Unlimited Project Creation**: Create projects with custom Jira codes, categories, priorities, kickoff dates, deadlines, budgets, and descriptions.
7. **Jira-Style Project Workspace**:
   - **Sprint Kanban Board**: 4 lanes (*To Do*, *In Progress*, *In Review*, *Completed*) with status movers and task deletions.
   - **Team & Engineers**: Add/remove developers with custom avatar colors and project roles.
   - **Timeline & Milestones**: Visual kickoff-to-deadline progress tracker and risk assessment.
   - **Audit Activity Log**: Records who created or moved items in real time.

---

## 🏃‍♂️ How to Run Locally

### 1. Start the Backend
Open a terminal in the `backend` folder:
```powershell
cd backend
npm start
```
*Backend runs at: `http://localhost:5000`*

### 2. Start the Frontend
Open a terminal in the `frontend` folder:
```powershell
cd frontend
npm run dev
```
*Frontend runs at: `http://localhost:5173`*
