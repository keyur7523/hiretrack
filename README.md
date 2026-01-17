# HireTrack

A modern job application tracking system with role-based access control for applicants, employers, and administrators.

## Features

- **Applicants**: Browse jobs, apply with resume/cover letter, track application status
- **Employers**: Post jobs, manage applications, update candidate pipeline status
- **Admins**: System health monitoring, audit logs, full visibility

### Technical Highlights

- Idempotent application submissions with Redis caching
- Status state machine (applied → reviewed → interview → accepted/rejected)
- JWT authentication with role-based route protection
- PostgreSQL with async SQLAlchemy + Alembic migrations

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python 3.11, SQLAlchemy, Pydantic |
| Database | PostgreSQL |
| Cache | Redis |
| Auth | JWT (HS256) |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env  # Edit with your DB/Redis URLs

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8080
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, receive JWT |
| GET | `/auth/me` | Current user info |
| GET | `/jobs` | List jobs (filtered by role) |
| POST | `/jobs` | Create job (employer) |
| POST | `/applications` | Apply to job (requires Idempotency-Key) |
| PATCH | `/applications/{id}/status` | Update status (employer) |
| GET | `/admin/health` | System health (admin) |
| GET | `/admin/audit-logs` | Audit trail (admin) |

## Environment Variables

```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
REDIS_URL=redis://:password@host:port
JWT_SECRET=your-secret-key
```

## Testing

```bash
cd backend
PYTHONPATH=. ./venv/bin/pytest tests/ -v
```


