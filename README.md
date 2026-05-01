# Ethara — Team Task Manager

> Full-Stack Assessment Submission | Ethara.AI

A production-grade **Team Task Manager** built with React, Node.js/Express, and MongoDB. Features role-based access control, project management, task assignment, and a real-time analytics dashboard.

---

## 🚀 Live Demo
https://ethara-ochre.vercel.app

- **API endpoint** `https://ethara-ochre.vercel.app/_/backend/api/auth/login` 
- **for backend testing:** `https://ethara-ochre.vercel.app/api/health` 

---

## Tech Stack

- Frontend: React
- Backend: Node.js, Express
- Database: MongoDB
- Deployment: Vercel

## Features

### Authentication
- Signup / Login with JWT
- First registered user becomes **Admin** automatically
- Role selection at registration (Admin / Member)
- Protected routes — unauthenticated users redirected to login

## 🔗 API Base URL
- Production: /_/backend/api
- Development: /api


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


## Local Setup

### Prerequisites
- Node.js v16+
- MongoDB (local) or MongoDB Atlas

### 1. Clone
```bash
git clone https://github.com/jaspreetkb03/ethara.git
cd ethara
```

### 2. Install dependencies
```bash
cd backend && npm install

