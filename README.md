# HireTrack

A production-grade job application tracking system with role-based access control, real-time system monitoring, and an immutable audit trail. Built from scratch with zero third-party auth services.

**Live Demo:** [hiretrack-puce.vercel.app](https://hiretrack-puce.vercel.app)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Vercel)                       │
│  React 18 · TypeScript · Tailwind · shadcn/ui · Zustand         │
│  Role-based routing · JWT token management · React Query         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / JSON
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API (Render)                        │
│  FastAPI · SQLAlchemy 2.0 (async) · Pydantic v2                 │
│  JWT auth · RBAC middleware · Request logging · Audit service    │
├──────────┬──────────┬───────────┬───────────────────────────────┤
│  Auth    │  Jobs    │  Apps     │  Admin                        │
│  Router  │  Router  │  Router   │  Router                       │
└────┬─────┴────┬─────┴─────┬─────┴─────┬─────────────────────────┘
     │          │           │           │
     ▼          ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│PostgreSQL│ │  Redis   │ │  Queue   │ │  Audit   │
│  (Neon)  │ │  Cache   │ │  Worker  │ │   Log    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

## Features by Role

### Applicant
- Browse and search jobs with filters (title, location, company)
- View job details and apply with resume + cover letter
- Track application status through the pipeline
- Idempotent submissions prevent duplicate applications

### Employer
- Create, edit, and manage job postings
- Review incoming applications per job
- Advance candidates through the status pipeline:
  `applied → reviewed → interview → accepted / rejected`
- Toggle job status (active/closed)

### Admin
- **System Health** — real-time status of database, Redis, and queue services
- **Metrics Dashboard** — total requests, error rates, queue depth, DLQ size
- **Audit Logs** — immutable trail of every auth, job, and application event with filtering

## Technical Highlights

| Feature | Implementation |
|---------|---------------|
| **Auth** | JWT (HS256) with role-based access control, bcrypt password hashing |
| **Idempotency** | Redis-backed deduplication with 24hr TTL per user + DB uniqueness constraint |
| **Status Machine** | FSM with explicit transition rules — invalid transitions return 400 |
| **Audit Trail** | Every mutation (register, login, job create, status change) logged with actor, action, entity, timestamp |
| **Caching** | Redis cache on job listings with automatic invalidation on create/update |
| **Background Queue** | Async event processing for application submissions |
| **Migrations** | Alembic auto-runs on server startup — zero manual migration steps |
| **Error Handling** | Global error boundaries (frontend), structured error responses (backend) |

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, React Query, Framer Motion |
| **Backend** | FastAPI, Python 3.11, SQLAlchemy 2.0 (async), Pydantic v2 |
| **Database** | PostgreSQL (Neon) |
| **Cache** | Redis (Redis Labs) |
| **Auth** | JWT (HS256), bcrypt, role-based middleware |
| **Infra** | Vercel (frontend), Render (backend), Alembic (migrations) |
| **Testing** | Pytest, Vitest |

## API Reference

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user (applicant/employer) | Public |
| POST | `/auth/login` | Login, receive JWT access token | Public |
| GET | `/auth/me` | Get current authenticated user | Bearer |

### Jobs
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/jobs` | List jobs with filters & pagination | Bearer |
| GET | `/jobs/{id}` | Get job details | Bearer |
| POST | `/jobs` | Create job posting | Employer |
| PATCH | `/jobs/{id}` | Update job (title, status, etc.) | Employer |

### Applications
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/applications` | Apply to job (idempotent) | Applicant |
| GET | `/applications` | List my applications | Applicant |
| GET | `/applications/{id}` | Application detail + status history | Bearer |
| PATCH | `/applications/{id}/status` | Advance candidate status | Employer |
| GET | `/employer/jobs/{id}/applications` | List applications for a job | Employer |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/health` | DB, Redis, queue health checks | Admin |
| GET | `/admin/audit-logs` | Filterable audit trail | Admin |
| GET | `/admin/metrics` | System metrics & queue stats | Admin |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env  # Edit with your DB/Redis URLs

# Run migrations & start server
alembic upgrade head
uvicorn app.main:app --reload --port 8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

### Environment Variables

```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
REDIS_URL=redis://:password@host:port
JWT_SECRET=your-secret-key
```

## Testing

```bash
# Backend
cd backend && PYTHONPATH=. pytest tests/ -v

# Frontend
cd frontend && npm test
```

## Project Structure

```
hiretrack/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, middleware, startup
│   │   ├── models.py        # SQLAlchemy ORM models
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   ├── auth.py          # JWT creation, password hashing
│   │   ├── deps.py          # Auth dependencies, role guards
│   │   ├── cache.py         # Redis caching utilities
│   │   ├── queue.py         # Background task queue
│   │   ├── metrics.py       # Request & system metrics
│   │   └── services/        # Business logic layer
│   ├── routers/             # API route handlers
│   ├── migrations/          # Alembic DB migrations
│   └── tests/               # Pytest suite
├── frontend/
│   ├── src/
│   │   ├── api/             # API client modules
│   │   ├── auth/            # Auth context & hooks
│   │   ├── components/      # UI components (shadcn/ui + custom)
│   │   ├── pages/           # Route page components
│   │   ├── routes/          # Router + role-based guards
│   │   ├── stores/          # Zustand state management
│   │   └── utils/           # Validators, formatters
│   └── public/              # Static assets
└── README.md
```
