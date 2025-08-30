# Archon

**AI-powered code analysis for Python projects.**

Archon is a large-scale, production-ready platform for analyzing (and soon: refactoring) Python codebases. The project is designed for future public deployment and hosting.

---

![Screenshot of the repository view](https://i.ibb.co/HLSkk4gZ/obraz-2025-08-30-103704800.png)
![Screenshot of the repository analysis](https://i.ibb.co/Fk03XhrS/Zrzut-ekranu-2025-08-30-103433.png)

---
## 🚀 Quick Start

### 1. Clone & Configure
```bash
git clone https://github.com/Daniel-Marciniak-developer/archon.git
cd archon
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Run with Docker Compose
```bash
docker compose up --build
```
*⏳ First launch takes about 7 minutes (420 seconds) as all services build and initialize.*

---

## 🌍 Why so big?
Archon is built for scale and reliability, with the goal of being hosted and released to the world as a professional-grade code analysis and refactoring service.

---

## 🧠 What does Archon do?
- **Currently:** Analyzes Python projects for code quality, structure, and security (results are not yet full-featured)
- **Coming soon:** Full project-wide Python refactoring and advanced code improvement tools

---

## 🏗️ Tech Stack
- **Frontend:** React + TypeScript
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL
- **Cache/Queue:** Redis + Celery

---

## URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

**Note:** Archon is not yet fully finished. The project is large and may look like it has a lot of unnecessary parts, but these are set up for future features and scalability. This is my favorite project—I'm deeply invested in it and will continue to develop and improve it!

---

<div align="center">
  <a href="https://shipwrecked.hackclub.com/?t=ghrm" target="_blank">
    <img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/739361f1d440b17fc9e2f74e49fc185d86cbec14_badge.png" 
         alt="This project is part of Shipwrecked, the world's first hackathon on an island!" 
         style="width: 35%;">
  </a>
</div>

