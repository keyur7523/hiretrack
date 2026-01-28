---
name: hiretrack-architecture
description: High-level architecture and design decisions for HireTrack. Use when discussing system design, adding major features, or onboarding new developers.
version: 1.0.0
tags: [architecture, design, overview]
---

# HireTrack Architecture Overview

## System Overview

HireTrack is a job application tracking system with three user roles:
- **Applicants**: Browse jobs, apply, track application status
- **Employers**: Post jobs, review applications, update statuses
- **Admins**: System health monitoring, audit logs

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | React 18.3 + TypeScript + Vite + TailwindCSS 3.4 + shadcn/ui |
| Backend | FastAPI 0.115 + SQLAlchemy 2.0 (async) + Pydantic v2 |
| Database | PostgreSQL (asyncpg) |
| Auth | JWT (python-jose, bcrypt) |
| Cache/Queue | Redis (caching, idempotency, task queue with DLQ) |
| Migrations | Alembic |

## Domain Model

```
┌──────────────┐       ┌──────────────┐
│     User     │       │     Job      │
│──────────────│       │──────────────│
│ id           │       │ id           │
│ email        │       │ title        │
│ password_hash│       │ company      │
│ role         │──────<│ employer_id  │
└──────────────┘   1:N └──────────────┘
       │                      │
       │                      │
       │ 1:N                  │ 1:N
       ▼                      ▼
┌──────────────┐       ┌──────────────┐
│ Application  │>──────│              │
│──────────────│       └──────────────┘
│ id           │
│ job_id       │
│ applicant_id │
│ status       │
│ resume_text  │
│ cover_letter │
└──────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐
│  AuditLog    │
│──────────────│
│ actor_id     │
│ action       │
│ entity_type  │
│ entity_id    │
└──────────────┘
```

## Application Status State Machine

```
    ┌─────────────────────────────────────┐
    │                                     │
    ▼                                     │
┌────────┐    ┌──────────┐    ┌───────────┴──┐    ┌──────────┐
│ APPLIED│───>│ REVIEWED │───>│  INTERVIEW   │───>│ ACCEPTED │
└────────┘    └──────────┘    └──────────────┘    └──────────┘
    │              │                 │
    │              │                 │
    ▼              ▼                 ▼
┌─────────────────────────────────────────┐
│              REJECTED                    │
└─────────────────────────────────────────┘
```

Terminal states: `ACCEPTED`, `REJECTED`

## Authentication Flow

```
1. User submits credentials → POST /auth/login
2. Backend validates → Returns JWT access token
3. Frontend stores token in localStorage
4. Frontend sends token in Authorization header
5. Backend validates token on each request
6. On 401 → Frontend clears token and redirects to login
```

## Frontend Architecture

### State Management

| Type | Solution | Example |
|------|----------|---------|
| Server State | React Query | Jobs list, applications |
| Auth State | React Context | User, token, login/logout |
| UI State | React Context | Toast notifications |
| Form State | Local useState | Form inputs, validation |

### Routing Structure

```
/login, /register, /forgot-password  → Public routes
/app                                  → Protected (requires auth)
  /app/jobs                          → Applicant: Browse jobs
  /app/applications                  → Applicant: My applications
  /app/employer/jobs                 → Employer: Manage jobs
  /app/admin/health                  → Admin: System health
  /app/admin/audit-logs              → Admin: Audit logs
  /app/account                       → All: Account settings
```

### Component Hierarchy

```
App
├── QueryClientProvider
├── BrowserRouter
│   └── AuthProvider
│       └── ToastProvider
│           └── AppRouter
│               ├── PublicRoutes (login, register)
│               └── ProtectedRoutes
│                   └── AppLayout
│                       ├── Header
│                       ├── Sidebar (desktop)
│                       ├── MobileNav (mobile)
│                       └── Outlet (page content)
```

## Backend Architecture

### Layer Structure

```
┌─────────────────────────────────────┐
│           Routers (API)             │  ← HTTP handlers, deps injection
├─────────────────────────────────────┤
│           Services                   │  ← Business logic, state machine
├─────────────────────────────────────┤
│           Models (SQLAlchemy 2.0)   │  ← Mapped[] types, Enums
└─────────────────────────────────────┘
```

### Project Layout

```
backend/
├── app/
│   ├── auth.py      # Password hashing, JWT creation
│   ├── cache.py     # Redis: get_cached, set_cached, invalidate
│   ├── config.py    # pydantic-settings (Settings class)
│   ├── db.py        # AsyncSession, Redis singleton
│   ├── deps.py      # get_current_user, require_roles()
│   ├── models.py    # SQLAlchemy models with Enums
│   ├── queue.py     # Task queue: enqueue, dequeue, DLQ
│   ├── schemas.py   # Pydantic v2 with AliasChoices
│   ├── utils.py     # paginate(), log_event()
│   ├── worker.py    # Background processor with retry
│   ├── metrics.py   # Thread-safe counters
│   └── services/
│       ├── applications.py  # TRANSITIONS state machine
│       ├── audit.py         # create_audit_log()
│       └── jobs.py          # list_jobs, create_job, etc.
├── routers/
│   ├── __init__.py   # Router aggregation
│   ├── auth.py       # /auth/register, login, me
│   ├── jobs.py       # /jobs CRUD with caching
│   ├── applications.py # /applications with idempotency
│   ├── employer.py   # /employer/jobs/{id}/applications
│   └── admin.py      # /admin/health, audit-logs, metrics
└── migrations/
    └── versions/
```

### Endpoint Naming Convention

| Method | Pattern | Example |
|--------|---------|---------|
| GET | `/resources` | List with pagination |
| GET | `/resources/{id}` | Get single resource |
| POST | `/resources` | Create resource |
| PATCH | `/resources/{id}` | Partial update |

## Security Considerations

1. **Password Storage**: bcrypt hashing (never plain text)
2. **JWT Tokens**: Short-lived (1 hour), no refresh tokens in v1
3. **Role Checks**: Middleware-level role validation
4. **Input Validation**: Pydantic schemas for all inputs
5. **SQL Injection**: Parameterized queries via SQLAlchemy

## Key Design Decisions

### ADR-001: No Multi-Tenancy (v1)

**Context**: Simplify initial development
**Decision**: Single-tenant architecture, no organization concept
**Consequence**: Easier to develop, but no data isolation between employers

### ADR-002: JWT in localStorage

**Context**: Need simple auth for SPA
**Decision**: Store JWT in localStorage, send in Authorization header
**Trade-off**: Simpler than cookies, but vulnerable to XSS
**Mitigation**: Content Security Policy, input sanitization

### ADR-003: Status State Machine

**Context**: Applications have defined lifecycle
**Decision**: Explicit state machine with validated transitions
**Consequence**: Prevents invalid states, clear audit trail

### ADR-004: Skeleton Loading

**Context**: Better perceived performance
**Decision**: All loading states use skeleton components, not spinners
**Consequence**: Users see content shape immediately, less jarring

### ADR-005: HSL Color System

**Context**: Need consistent theming with dark mode support
**Decision**: All colors defined as HSL CSS variables
**Consequence**: Easy theme switching, consistent palette

## Performance Considerations

1. **Database Indexes**: On foreign keys and common filters
2. **Pagination**: All list endpoints paginated (default 10 items)
3. **React Query Caching**: 5 minute stale time for lists
4. **Skeleton Loading**: Immediate visual feedback

## What's Already Implemented

- ✅ Redis for idempotency keys (24-hour TTL)
- ✅ Redis task queue with DLQ and retry backoff
- ✅ Redis caching for job listings (60-second TTL)
- ✅ Request logging middleware with X-Request-ID
- ✅ Metrics endpoint for monitoring
- ✅ StatusHistory table for audit trail
- ✅ Comprehensive test suite (30 E2E tests)

## Future Considerations

- [ ] Add refresh tokens for better security
- [ ] Add file upload for resumes (S3)
- [ ] Add real-time notifications (WebSocket)
- [ ] Add multi-tenancy for enterprise
- [ ] Add email notifications
