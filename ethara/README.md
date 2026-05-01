# Ethara — Team Task Manager

> Full-Stack Assessment Submission | Ethara.AI

A production-grade **Team Task Manager** built with React, Node.js/Express, and MongoDB. Features role-based access control, project management, task assignment, and a real-time analytics dashboard.

---

## Live Demo

- **Frontend:** `https://ethara-frontend.vercel.app` *(replace with your URL)*
- **Backend API:** `https://ethara-backend.railway.app` *(replace with your URL)*

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router v6, Chart.js |
| Backend | Node.js, Express.js, express-validator |
| Database | MongoDB, Mongoose |
| Auth | JWT + bcryptjs |
| Deployment | Railway (backend) + Vercel (frontend) |

---

## Features

### Authentication
- Signup / Login with JWT
- First registered user becomes **Admin** automatically
- Role selection at registration (Admin / Member)
- Protected routes — unauthenticated users redirected to login

### Role-Based Access Control
| Feature | Admin | Member |
|---------|-------|--------|
| Create/delete projects | ✅ | ✅ (own projects) |
| Add/remove team members | ✅ (project admin) | ❌ |
| Create tasks | ✅ | ✅ (in their projects) |
| Delete tasks | ✅ | Own tasks only |
| Change member roles | ✅ | ❌ |
| View all users (admin panel) | ✅ | ❌ |

### Project Management
- Create projects with name, description, priority, deadline, and color
- Add/remove team members by email
- Assign project-level roles (Project Admin / Member)
- Track project status (Active, On Hold, Completed, Archived)
- Progress bar showing completed vs total tasks

### Task Management
- Create, edit, delete tasks within projects
- Assign tasks to project members
- Set priority (Low / Medium / High / Critical)
- Set status (To Do / In Progress / In Review / Done)
- Due date tracking with overdue detection
- Kanban board view inside each project
- "My Tasks" view — see all tasks assigned to you across all projects

### Dashboard
- Stats: My Projects, My Tasks, Total Tasks, Overdue
- Status donut chart, Priority bar chart
- Project progress cards
- Recent tasks list
- Admin-only: Total Users + Total Projects across platform

---

## API Endpoints

### Auth
```
POST /api/auth/register    — Register
POST /api/auth/login       — Login
GET  /api/auth/me          — Current user (protected)
```

### Projects (protected)
```
GET    /api/projects                          — My projects
POST   /api/projects                          — Create project
GET    /api/projects/:id                      — Project detail
PUT    /api/projects/:id                      — Update project (admin)
DELETE /api/projects/:id                      — Delete project (admin)
POST   /api/projects/:id/members              — Add member (admin)
DELETE /api/projects/:id/members/:userId      — Remove member (admin)
PATCH  /api/projects/:id/members/:userId/role — Update member role (admin)
```

### Tasks (protected)
```
GET    /api/tasks/project/:projectId   — Project tasks
GET    /api/tasks/my                   — My assigned tasks
POST   /api/tasks                      — Create task
PUT    /api/tasks/:id                  — Update task
PATCH  /api/tasks/:id/status           — Quick status update
DELETE /api/tasks/:id                  — Delete task
```

### Stats
```
GET /api/stats/dashboard  — Dashboard analytics
```

---

## Local Setup

### Prerequisites
- Node.js v16+
- MongoDB (local) or MongoDB Atlas

### 1. Clone
```bash
git clone <your-repo>
cd ethara
```

### 2. Install dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure backend
```bash
cd backend
cp .env.example .env
# Edit .env — set your MONGODB_URI and JWT_SECRET
```

### 4. Run
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm start
```

- Frontend: http://localhost:3000
- API: http://localhost:5000/api

---

## Deployment (Railway + Vercel)

### Backend → Railway
1. Push to GitHub
2. New project on railway.app → Deploy from GitHub
3. Select `backend/` as root directory
4. Set env vars: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`, `FRONTEND_URL=https://your-vercel-app.vercel.app`
5. Start command: `node server.js`

### Frontend → Vercel
1. New project on vercel.com → Import GitHub repo
2. Set root directory to `frontend/`
3. Set env var: `REACT_APP_API_URL=https://your-railway-app.railway.app/api`
4. Build command: `npm run build`

### Full app → Render
1. Push repo to GitHub
2. New service on render.com → Web Service
3. Connect GitHub repo and select this repository
4. Set root directory to `/`
5. Build command: `npm run build`
6. Start command: `npm start`
7. Set env vars:
   - `NODE_ENV=production`
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `FRONTEND_URL=https://your-render-app.onrender.com`

### Database → MongoDB Atlas
1. Create free M0 cluster at cloud.mongodb.com
2. Whitelist `0.0.0.0/0` (allow all IPs for Render/Railway)
3. Copy connection string → use as `MONGODB_URI`

---

## Project Structure

```
ethara/
├── backend/
│   ├── middleware/auth.js      # JWT + role guards
│   ├── models/
│   │   ├── User.js             # User + global role
│   │   ├── Project.js          # Project + members + roles
│   │   └── Task.js             # Task with assignee
│   ├── routes/
│   │   ├── auth.js             # Register / Login / Me
│   │   ├── projects.js         # Project CRUD + members
│   │   ├── tasks.js            # Task CRUD
│   │   ├── users.js            # User listing / search
│   │   └── stats.js            # Dashboard analytics
│   ├── server.js
│   └── .env.example
│
├── frontend/src/
│   ├── context/AuthContext.js  # Global auth state
│   ├── utils/api.js            # Axios + interceptors
│   ├── pages/
│   │   ├── AuthPage.js         # Login + Register
│   │   ├── DashboardPage.js    # Analytics dashboard
│   │   ├── ProjectsPage.js     # Projects list + create
│   │   ├── ProjectDetailPage.js# Kanban board + members
│   │   └── MyTasksPage.js      # Personal task view
│   └── components/Layout.js    # Sidebar navigation
│
└── README.md
```
