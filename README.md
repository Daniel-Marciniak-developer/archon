# Archon - Code Analysis Platform

This project consists of a FastAPI backend server and a React + TypeScript frontend application for analyzing GitHub repositories.

## Stack

- **Frontend**: React + TypeScript with `npm` as package manager
- **Backend**: Python FastAPI with `pip` as package manager
- **Database**: PostgreSQL
- **Cache/Queue**: Redis + Celery
- **Authentication**: Firebase Auth or Stack Auth

## Prerequisites

Before running the project, you need:

1. **Python 3.12+**
2. **Node.js 18+** and **npm**
3. **PostgreSQL 15+**
4. **Redis** (for background tasks)

## Quick Setup

### 1. Database Setup
```bash
# See SETUP-DATABASE.md for detailed instructions
createdb archon_dev
psql -d archon_dev -f backend/schema.sql
```

### 2. Redis Setup
```bash
# See SETUP-REDIS.md for detailed instructions
# Option 1: Docker
docker run -d --name redis -p 6379:6379 redis:latest

# Option 2: WSL2
sudo service redis-server start
```

### 3. Environment Variables
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database and Redis URLs

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your API URLs
```

### 4. Install Dependencies & Run
```bash
# Use the startup script (Windows)
startup.bat

# Or manually:
# Backend
cd backend && pip install -r requirements.txt
python -m uvicorn main:app --reload

# Frontend (separate terminal)
cd frontend && npm install
npm run dev
```

## URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Background Tasks

For code analysis to work, start Celery worker:
```bash
cd backend
celery -A app.libs.celery_worker worker --loglevel=info
```
