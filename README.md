# HireTrack

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=flat-square)](https://hiretrack-puce.vercel.app)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com)

An AI-powered hiring platform with resume screening, role-based access control, and a complete audit trail. Not a tutorial CRUD app — a production system with real architecture decisions.

**Live Demo:** [hiretrack-puce.vercel.app](https://hiretrack-puce.vercel.app) &nbsp;|&nbsp; 50 seeded jobs &nbsp;|&nbsp; AI screening enabled

---

## Why I Built This

Most portfolio projects stop at "I can build a form that talks to a database." HireTrack goes further:

- **AI integration that actually does something** — every resume is scored against the job description by GPT-4o-mini with structured output (score, skills match, strengths, concerns)
- **Real RBAC from scratch** — no Auth0, no Clerk, no Firebase Auth. JWT + bcrypt + role middleware, because I wanted to understand the full auth stack
- **Production patterns** — idempotent submissions, status machines with transition rules, background task processing, structured audit logging
- **Async everywhere** — SQLAlchemy 2.0 async, asyncpg, async Redis, async OpenAI calls. Not blocking threads.

---

## Architecture

```
                              ┌──────────────────────────────────┐
                              │       Frontend (Vercel)          │
                              │  React 18 · TypeScript · Tailwind│
                              │  shadcn/ui · Zustand · Framer    │
                              └───────────────┬──────────────────┘
                                              │ HTTPS / JSON
                                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Backend API (Render)                           │
│  FastAPI · SQLAlchemy 2.0 (async) · Pydantic v2 · JWT RBAC            │
│                                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Auth    │ │  Jobs    │ │ Applications │ │ Employer │ │  Admin   │ │
│  │  Router  │ │  Router  │ │   Router     │ │  Router  │ │  Router  │ │
│  └────┬─────┘ └────┬─────┘ └──────┬───────┘ └────┬─────┘ └────┬─────┘ │
│       │            │              │               │            │       │
│       ▼            ▼              ▼               ▼            ▼       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Services Layer                             │   │
│  │  applications.py · jobs.py · screening.py · audit.py            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────┬──────────────┬──────────────┬──────────────┬──────────────────────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐
│PostgreSQL│  │  Redis   │  │  Queue   │  │   OpenAI     │
│  (Neon)  │  │  Cache   │  │  Worker  │  │  GPT-4o-mini │
│          │  │          │  │  (async) │  │  AI Screening│
└──────────┘  └──────────┘  └──────────┘  └──────────────┘
```

### Data Flow: Application Submission → AI Screening

```
Applicant submits resume
        │
        ▼
POST /applications (idempotency check)
        │
        ├──▶ Insert Application (status: applied)
        ├──▶ Insert StatusHistory record
        ├──▶ Create AIScreening (status: pending)
        │
        ▼
Background Task fires
        │
        ├──▶ Load job description + resume text
        ├──▶ Call OpenAI GPT-4o-mini with structured prompt
        ├──▶ Parse JSON response (score, skills, strengths, concerns)
        ├──▶ Update AIScreening (status: completed, score: 0-100)
        └──▶ Write audit log entry
```

---

## Key Features

### AI Resume Screening
Every application is automatically analyzed against the job description. The system returns:
- **Fit score** (0-100) with color-coded badges
- **Skills breakdown** — matched, missing, and bonus skills
- **Experience assessment** — relevance to the role
- **Strengths & concerns** — specific observations
- **Recommendation** — strong match / good match / partial / weak

Employers see the full report. Applicants see score + recommendation only (role-gated response).

### PDF Resume Upload
Applicants can upload a PDF resume instead of pasting text. The backend extracts text server-side using `pypdf`, previews it in an editable textarea, then submits normally. No file storage needed — clean separation of concerns.

### Employer Analytics Dashboard
Real-time dashboard with four charts powered by Recharts:
- **Applications over time** — area chart showing submission trends
- **Status breakdown** — donut chart (applied / reviewed / interview / accepted / rejected)
- **AI score distribution** — bar chart bucketed by score range (0-20, 21-40, etc.)
- **Top jobs by applications** — horizontal bar chart ranking jobs

Plus summary cards: total jobs, total applications, average AI score, acceptance rate.

### Role-Based Access Control
Three roles with enforced boundaries at every layer:

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| **Applicant** | Browse jobs, apply, track status, view own AI score | See other applicants, manage jobs, access admin |
| **Employer** | Post jobs, review applications, see full AI reports, update status | Apply to jobs, access admin, see other employers' jobs |
| **Admin** | System health, metrics, audit logs | Create jobs, submit applications |

### Application Status Machine
```
applied ──▶ reviewed ──▶ interview ──▶ accepted
   │            │            │
   └──▶ rejected └──▶ rejected └──▶ rejected
```
Invalid transitions return 409 Conflict. Every transition is logged with actor, timestamp, and previous state.

### Landing Page
Custom-designed landing page with Inter font, scroll animations (Framer Motion), AI screening showcase with real scores, feature grid, tech stack display, role breakdown, and demo credentials — consistent with the app's light design system.

### Dark Mode
Full light/dark/system theme support via Zustand-persisted theme store. All UI components use HSL CSS variables that swap between modes. Toggle in the header nav.

### Production Patterns
- **Idempotent submissions** — same user + same job = one application, enforced at DB level + friendly "already applied" detection with link to existing application
- **Structured audit trail** — every mutation logged with actor ID, action, entity, timestamp, metadata
- **Background processing** — async task queue for AI screening (graceful degradation if Redis unavailable)
- **Auto-migrations** — Alembic runs on server startup, zero manual steps
- **Error boundaries** — frontend global error handling, backend structured error responses
- **Graceful degradation** — app works fully without Redis (AI screening runs inline, caching disabled)

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework with hooks |
| TypeScript 5.8 | Type safety across the entire frontend |
| Vite 5 | Build tool with HMR |
| Tailwind CSS 3 | Utility-first styling with custom design tokens |
| shadcn/ui | Component library (Radix primitives) |
| Zustand 5 | State management (auth store, UI store) |
| Framer Motion 12 | Page transitions and scroll animations |
| Recharts 2 | Analytics dashboard charts (area, pie, bar) |
| React Router 6 | Client-side routing with role guards |

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI 0.115 | Async API framework |
| Python 3.11 | Runtime |
| SQLAlchemy 2.0 | Async ORM with mapped columns |
| Pydantic v2 | Request/response validation with aliases |
| asyncpg | Async PostgreSQL driver |
| python-jose | JWT token creation and verification |
| bcrypt | Password hashing |
| Anthropic + OpenAI SDKs | Dual-provider AI screening |
| pypdf | Server-side PDF text extraction |

### Infrastructure
| Service | Purpose |
|---------|---------|
| PostgreSQL (Neon) | Primary database, serverless |
| Redis | Caching, idempotency, task queue |
| Vercel | Frontend hosting with auto-deploy |
| Render | Backend hosting with auto-deploy |
| Alembic | Database migrations |

---

## API Reference

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user (applicant/employer) | Public |
| POST | `/auth/login` | Login, receive JWT token | Public |
| GET | `/auth/me` | Get authenticated user | Bearer |

### Jobs
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/jobs` | List jobs with search, filters, pagination | Bearer |
| GET | `/jobs/{id}` | Job detail | Bearer |
| POST | `/jobs` | Create job posting | Employer |
| PATCH | `/jobs/{id}` | Update job | Employer |

### Applications
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/applications` | Apply to job (idempotent, triggers AI screening) | Applicant |
| POST | `/applications/parse-resume` | Upload PDF, extract text server-side (multipart) | Applicant |
| GET | `/applications` | List my applications | Applicant |
| GET | `/applications/{id}` | Detail + status history + AI screening (role-gated) | Bearer |
| PATCH | `/applications/{id}/status` | Advance candidate status | Employer |

### Employer
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/employer/jobs/{id}/applications` | List applications with AI scores, sort, filter | Employer |
| GET | `/employer/analytics` | Dashboard data (summary, charts, top jobs) | Employer |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/health` | DB, Redis, queue health checks | Admin |
| GET | `/admin/audit-logs` | Filterable audit trail | Admin |
| GET | `/admin/metrics` | System metrics & queue stats | Admin |

---

## Demo Credentials

The live demo at [hiretrack-puce.vercel.app](https://hiretrack-puce.vercel.app) is seeded with 50 jobs and 18 AI-screened applications.

| Role | Email | Password |
|------|-------|----------|
| Employer | `employer@hiretrack.demo` | `DemoPass123!` |
| Applicant | `alice.chen@hiretrack.demo` | `DemoPass123!` |
| Applicant | `bob.martinez@hiretrack.demo` | `DemoPass123!` |
| Applicant | `carol.johnson@hiretrack.demo` | `DemoPass123!` |

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis (optional — app degrades gracefully)

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, REDIS_URL, JWT_SECRET, OPENAI_API_KEY

# Run migrations & start
alembic upgrade head
uvicorn app.main:app --reload --port 8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Environment Variables
```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
REDIS_URL=redis://:password@host:port
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...                # For AI screening
AI_PROVIDER=openai                   # or "anthropic"
AI_SCREENING_ENABLED=true
```

### Seed Demo Data
```bash
cd backend
python3 seed.py http://localhost:8080
```

---

## Project Structure

```
hiretrack/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, middleware, startup, worker
│   │   ├── models.py            # SQLAlchemy models (User, Job, Application, AIScreening, AuditLog)
│   │   ├── schemas.py           # Pydantic schemas with alias support
│   │   ├── config.py            # Settings with AI provider config
│   │   ├── auth.py              # JWT + bcrypt
│   │   ├── deps.py              # Auth dependencies, role guards
│   │   ├── cache.py             # Redis caching
│   │   ├── queue.py             # Background task queue
│   │   ├── worker.py            # Task handlers (submitted, status_changed, screen_resume)
│   │   ├── metrics.py           # Request & system metrics
│   │   └── services/
│   │       ├── applications.py  # Application business logic
│   │       ├── jobs.py          # Job business logic
│   │       ├── screening.py     # AI screening (OpenAI/Anthropic dual-provider)
│   │       └── audit.py         # Audit log service
│   ├── routers/                 # API route handlers
│   ├── migrations/              # Alembic (0001_initial, 0002_ai_screenings)
│   ├── seed.py                  # Demo data seeder (50 jobs, 3 applicants, 18 applications)
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── api/                 # Typed API client (fetch-based)
│   │   ├── auth/                # Auth hook & token management
│   │   ├── components/
│   │   │   ├── layout/          # AppLayout, Header, Sidebar, MobileNav
│   │   │   ├── screening/       # AIScreeningCard, AIScreeningSummaryCard
│   │   │   ├── motion/          # FadeIn, SlideIn, StaggerList
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── pages/
│   │   │   ├── public/          # LandingPage, LoginPage, RegisterPage
│   │   │   ├── applicant/       # Jobs, JobDetail (PDF upload), Applications, ApplicationDetail
│   │   │   ├── employer/        # Dashboard (charts), ManageJobs, CreateJob, EditJob, ReviewApplications
│   │   │   ├── admin/           # Health, Metrics, AuditLogs
│   │   │   └── common/          # Account, Unauthorized, NotFound
│   │   ├── routes/              # Router + ProtectedRoute + RoleRoute
│   │   ├── stores/              # Zustand (auth, UI, theme)
│   │   ├── types/               # TypeScript interfaces
│   │   └── utils/               # Validators, formatters
│   └── public/
└── README.md
```

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **No Auth0/Clerk** | Wanted to implement the full auth stack to demonstrate understanding of JWTs, password hashing, middleware, and RBAC |
| **SQLAlchemy 2.0 async** | Modern mapped column syntax, async session for non-blocking DB ops |
| **Dual AI provider** | Supports both OpenAI and Anthropic — configurable via env var, same prompt/schema |
| **JSONB for screening results** | Flexible schema for AI output without additional tables for skills/strengths/concerns |
| **Inline background tasks** | Runs AI screening as asyncio tasks in the web process — avoids needing a separate worker service on free tier |
| **Status machine** | Explicit transition rules prevent invalid state changes, every transition audited |
| **Idempotency** | Header-based idempotency key + DB unique constraint prevents duplicate applications |
| **Server-side PDF parsing** | Extract text on backend (not client-side JS) — more reliable, works with all PDFs, no WASM overhead |
| **Graceful Redis degradation** | App detects Redis availability at startup, disables worker/cache if unavailable, runs AI screening inline |
| **Single analytics endpoint** | One `/employer/analytics` call returns all dashboard data — avoids waterfall of 5 separate requests |

---

## License

MIT
