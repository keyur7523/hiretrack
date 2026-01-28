---
name: hiretrack-backend
description: Backend conventions for HireTrack - FastAPI, PostgreSQL, SQLAlchemy 2.0 async, Redis, JWT auth. Use when creating or modifying API endpoints, database models, or backend logic.
version: 2.0.0
tags: [fastapi, python, postgresql, sqlalchemy, redis, backend]
---

# HireTrack Backend Skill

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | FastAPI | 0.115.0 |
| Database | PostgreSQL | asyncpg |
| ORM | SQLAlchemy 2.0 (async) | 2.0.32 |
| Migrations | Alembic | 1.13.2 |
| Auth | JWT (python-jose) | 3.3.0 |
| Password | passlib + bcrypt | 1.7.4 / 4.0.1 |
| Validation | Pydantic v2 | 2.8.2 |
| Settings | pydantic-settings | 2.4.0 |
| Cache/Queue | Redis (async) | 5.0.8 |

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── auth.py           # Password hashing, JWT creation
│   ├── cache.py          # Redis caching utilities
│   ├── config.py         # Settings from environment
│   ├── db.py             # Database & Redis connections
│   ├── deps.py           # FastAPI dependencies (auth)
│   ├── main.py           # App entry point, middleware
│   ├── metrics.py        # Thread-safe counters
│   ├── models.py         # SQLAlchemy models
│   ├── queue.py          # Redis-based task queue
│   ├── schemas.py        # Pydantic schemas
│   ├── utils.py          # Helpers (pagination, logging)
│   ├── worker.py         # Background task processor
│   └── services/
│       ├── applications.py
│       ├── audit.py
│       └── jobs.py
├── routers/
│   ├── __init__.py       # Router aggregation
│   ├── admin.py
│   ├── applications.py
│   ├── auth.py
│   ├── employer.py
│   └── jobs.py
├── migrations/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
└── tests/
```

## Configuration Pattern

```python
# app/config.py
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    database_url: str = Field(alias='DATABASE_URL')
    redis_url: str = Field(alias='REDIS_URL')
    jwt_secret: str = Field(alias='JWT_SECRET')
    jwt_algorithm: str = Field(default='HS256', alias='JWT_ALGORITHM')
    access_token_expire_minutes: int = Field(default=60, alias='ACCESS_TOKEN_EXPIRE_MINUTES')
    env: str = Field(default='dev', alias='ENV')
    cors_origins: str = Field(default='http://localhost:5173', alias='CORS_ORIGINS')

    model_config = SettingsConfigDict(
        case_sensitive=False,
        env_file=str(Path(__file__).resolve().parents[1] / '.env'),
        env_file_encoding='utf-8',
    )

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

## Database Connection

```python
# app/db.py
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
import redis.asyncio as redis

class Base(DeclarativeBase):
    pass

settings = get_settings()
engine = create_async_engine(settings.database_url, echo=False, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

# Redis singleton
redis_client: redis.Redis | None = None

def init_redis() -> None:
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(settings.redis_url, decode_responses=True)

def get_redis() -> redis.Redis:
    if redis_client is None:
        init_redis()
    return redis_client

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
```

## Models (SQLAlchemy 2.0 Mapped Style)

### Enums

```python
import enum

class UserRole(str, enum.Enum):
    applicant = 'applicant'
    employer = 'employer'
    admin = 'admin'

class EmploymentType(str, enum.Enum):
    full_time = 'full_time'
    part_time = 'part_time'
    contract = 'contract'

class JobStatus(str, enum.Enum):
    active = 'active'
    archived = 'archived'

class ApplicationStatus(str, enum.Enum):
    applied = 'applied'
    reviewed = 'reviewed'
    interview = 'interview'
    rejected = 'rejected'
    accepted = 'accepted'
```

### Model Definitions

```python
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

class User(Base):
    __tablename__ = 'users'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name='user_role'), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    jobs = relationship('Job', back_populates='employer', cascade='all, delete-orphan')

class Job(Base):
    __tablename__ = 'jobs'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('users.id'), index=True, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    company: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    employment_type: Mapped[EmploymentType] = mapped_column(Enum(EmploymentType, name='employment_type'), nullable=False)
    remote: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[JobStatus] = mapped_column(Enum(JobStatus, name='job_status'), default=JobStatus.active, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    employer = relationship('User', back_populates='jobs')
    applications = relationship('Application', back_populates='job', cascade='all, delete-orphan')

class Application(Base):
    __tablename__ = 'applications'
    __table_args__ = (
        UniqueConstraint('job_id', 'applicant_id', name='uq_applications_job_applicant'),
        Index('ix_applications_job_id', 'job_id'),
        Index('ix_applications_applicant_id', 'applicant_id'),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('jobs.id'), nullable=False)
    applicant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    resume_text: Mapped[str] = mapped_column(Text, nullable=False)
    cover_letter: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ApplicationStatus] = mapped_column(Enum(ApplicationStatus, name='application_status'), default=ApplicationStatus.applied, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    job = relationship('Job', back_populates='applications')

class StatusHistory(Base):
    __tablename__ = 'status_history'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('applications.id'), index=True, nullable=False)
    status: Mapped[ApplicationStatus] = mapped_column(Enum(ApplicationStatus, name='status_history_status'), nullable=False)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    changed_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

class AuditLog(Base):
    __tablename__ = 'audit_logs'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey('users.id'), index=True, nullable=True)
    action: Mapped[str] = mapped_column(Text, index=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(Text, index=True, nullable=False)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    metadata_: Mapped[dict] = mapped_column('metadata', JSONB, default=dict, nullable=False)
```

## Pydantic Schemas

### Field Aliasing Pattern (snake_case DB → camelCase API)

```python
from pydantic import AliasChoices, BaseModel, ConfigDict, Field, EmailStr

class JobResponse(BaseModel):
    id: UUID
    title: str
    company: str
    location: str
    description: str
    employmentType: EmploymentType = Field(
        validation_alias=AliasChoices('employment_type', 'employmentType'),
        serialization_alias='employmentType',
    )
    remote: bool
    status: JobStatus
    createdAt: datetime = Field(
        validation_alias=AliasChoices('created_at', 'createdAt'),
        serialization_alias='createdAt',
    )

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class ApplicationResponse(BaseModel):
    id: UUID
    jobId: UUID = Field(validation_alias='job_id', serialization_alias='jobId')
    applicantId: UUID = Field(validation_alias='applicant_id', serialization_alias='applicantId')
    status: ApplicationStatus
    createdAt: datetime = Field(validation_alias='created_at', serialization_alias='createdAt')
    resumeText: str | None = Field(default=None, validation_alias='resume_text', serialization_alias='resumeText')
    coverLetter: str | None = Field(default=None, validation_alias='cover_letter', serialization_alias='coverLetter')

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
```

### Paginated Response

```python
class PaginatedResponse(BaseModel):
    items: list[Any]
    page: int
    pageSize: int
    total: int
```

## Authentication

### Password Hashing (app/auth.py)

```python
from passlib.context import CryptContext
from jose import jwt

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

def create_access_token(*, user_id: UUID, email: str, role: str) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {
        'sub': str(user_id),
        'email': email,
        'role': role,
        'exp': expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
```

### Dependencies (app/deps.py)

```python
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer(auto_error=False)

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    session: AsyncSession = Depends(get_session),
) -> User:
    if credentials is None or credentials.scheme.lower() != 'bearer':
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Not authenticated')

    token = credentials.credentials
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token') from exc

    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')

    result = await session.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')
    
    request.state.user_id = str(user.id)
    return user

def require_roles(*roles: UserRole):
    async def _require_roles(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Forbidden')
        return user
    return _require_roles
```

## Application Status State Machine

```python
# app/services/applications.py
TRANSITIONS: dict[ApplicationStatus, set[ApplicationStatus]] = {
    ApplicationStatus.applied: {ApplicationStatus.reviewed, ApplicationStatus.rejected},
    ApplicationStatus.reviewed: {ApplicationStatus.interview, ApplicationStatus.rejected},
    ApplicationStatus.interview: {ApplicationStatus.accepted, ApplicationStatus.rejected},
    ApplicationStatus.accepted: set(),
    ApplicationStatus.rejected: set(),
}

async def update_application_status(
    session: AsyncSession,
    *,
    application: Application,
    new_status: ApplicationStatus,
    actor: User,
) -> Application:
    allowed = TRANSITIONS.get(application.status, set())
    if new_status not in allowed:
        raise ValueError('invalid_transition')

    application.status = new_status
    status_history = StatusHistory(
        application_id=application.id,
        status=new_status,
        changed_by=actor.id,
    )
    session.add(status_history)
    await session.flush()

    await create_audit_log(
        session,
        actor_id=actor.id,
        action='application.status_changed',
        entity_type='application',
        entity_id=application.id,
        metadata={'applicationId': str(application.id), 'status': new_status.value},
    )

    return application
```

## Idempotency Pattern

```python
# Required header for application creation
@router.post('', response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    payload: ApplicationCreate,
    idempotency_key: str | None = Header(default=None, alias='Idempotency-Key'),
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_roles(UserRole.applicant)),
):
    if not idempotency_key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Idempotency-Key required')

    # Check Redis cache first
    redis_client = get_redis()
    key = f'idem:{user.id}:{idempotency_key}'
    
    try:
        existing_id = await redis_client.get(key)
        if existing_id:
            cached_app = await session.get(Application, UUID(existing_id))
            if cached_app:
                return cached_app
    except Exception:
        pass  # Redis failure is non-fatal

    # Create application...
    
    # Cache the result (24 hour TTL)
    try:
        await redis_client.setex(key, int(timedelta(hours=24).total_seconds()), str(application.id))
    except Exception:
        pass  # Redis failure is non-fatal
```

## Caching Pattern

```python
# app/cache.py
CACHE_TTL_SECONDS = 60

async def get_cached(key: str) -> Any | None:
    try:
        redis_client = get_redis()
        raw = await redis_client.get(key)
        if not raw:
            return None
        return json.loads(raw)
    except Exception:
        return None

async def set_cached(key: str, value: Any) -> None:
    try:
        redis_client = get_redis()
        await redis_client.setex(key, CACHE_TTL_SECONDS, json.dumps(value))
    except Exception:
        return None

async def invalidate_jobs_cache() -> None:
    try:
        redis_client = get_redis()
        async for key in redis_client.scan_iter(match='jobs:*'):
            await redis_client.delete(key)
    except Exception:
        return None
```

### Cache Key Pattern

```python
# Jobs list cache key includes all filter parameters
user_key = str(user.id) if user.role == UserRole.employer else 'global'
cache_key = f"jobs:list:{user.role.value}:{user_key}:{query or ''}:{location or ''}:{company or ''}:{page or 1}:{pageSize or 10}"
```

## Task Queue Pattern

```python
# app/queue.py
QUEUE_KEY = 'queue:tasks'
DLQ_KEY = 'queue:dlq'

async def enqueue(task_type: str, payload: dict[str, Any]) -> dict[str, Any]:
    task = {
        'id': str(uuid.uuid4()),
        'type': task_type,
        'payload': payload,
        'attempts': 0,
    }
    redis_client = get_redis()
    await redis_client.rpush(QUEUE_KEY, json.dumps(task))
    return task

async def dequeue(timeout: int = 5) -> dict[str, Any] | None:
    redis_client = get_redis()
    item = await redis_client.blpop(QUEUE_KEY, timeout=timeout)
    if not item:
        return None
    _, raw = item
    return json.loads(raw)
```

### Worker with Retry & DLQ

```python
# app/worker.py
BACKOFF_SECONDS = [1, 4, 10]
MAX_RETRIES = 3

async def process_once() -> bool:
    task = await dequeue()
    if not task:
        return False

    attempts = int(task.get('attempts', 0))
    try:
        await process_task(task)
        return True
    except Exception as exc:
        attempts += 1
        task['attempts'] = attempts
        task['error'] = str(exc)
        if attempts >= MAX_RETRIES:
            await push_dlq(task)
        else:
            delay = BACKOFF_SECONDS[min(attempts - 1, len(BACKOFF_SECONDS) - 1)]
            await asyncio.sleep(delay)
            await requeue(task)
        return False
```

## Audit Logging

```python
# app/services/audit.py
async def create_audit_log(
    session: AsyncSession,
    *,
    actor_id: UUID | None,
    action: str,
    entity_type: str,
    entity_id: UUID | None,
    metadata: dict[str, Any],
) -> None:
    log = AuditLog(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        metadata_=metadata,
    )
    session.add(log)
    await session.flush()
```

### Standard Actions

| Action | Entity Type | When |
|--------|-------------|------|
| `auth.register` | auth | User registration |
| `auth.login` | auth | User login |
| `job.created` | job | New job posted |
| `job.updated` | job | Job details changed |
| `application.created` | application | New application submitted |
| `application.status_changed` | application | Status transition |

## Pagination Helper

```python
# app/utils.py
def paginate(page: int | None, page_size: int | None) -> tuple[int, int]:
    safe_page = max(page or 1, 1)
    safe_size = max(page_size or 10, 1)
    return safe_page, safe_size
```

## Request Logging Middleware

```python
@app.middleware('http')
async def request_logging_middleware(request: Request, call_next):
    request_id = get_request_id()
    request.state.request_id = request_id
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000
    increment('total_requests', 1)
    if response.status_code >= 400:
        increment('error_requests', 1)
    log_event(
        'request',
        request_id=request_id,
        user_id=getattr(request.state, 'user_id', None),
        endpoint=request.url.path,
        method=request.method,
        status_code=response.status_code,
        duration_ms=round(duration_ms, 2),
    )
    response.headers['X-Request-ID'] = request_id
    return response
```

## Error Handling

```python
# Standard error responses
raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Idempotency-Key required')
raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Not authenticated')
raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')
raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Forbidden')
raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Job not found')
raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Application not found')
raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Application already exists')
raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Invalid status transition')
```

## Router Registration

```python
# routers/__init__.py
from fastapi import APIRouter

from routers.auth import router as auth_router
from routers.jobs import router as jobs_router
from routers.applications import router as applications_router
from routers.employer import router as employer_router
from routers.admin import router as admin_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(jobs_router)
router.include_router(applications_router)
router.include_router(employer_router)
router.include_router(admin_router)
```

## API Endpoints Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | None | Register new user |
| POST | /auth/login | None | Login, get JWT |
| GET | /auth/me | User | Get current user |
| GET | /jobs | User | List jobs (filtered by role) |
| GET | /jobs/{id} | User | Get job details |
| POST | /jobs | Employer | Create job |
| PATCH | /jobs/{id} | Employer | Update own job |
| GET | /applications | Applicant | List own applications |
| POST | /applications | Applicant | Submit application |
| GET | /applications/{id} | User | Get application details |
| PATCH | /applications/{id}/status | Employer/Admin | Update status |
| GET | /employer/jobs/{id}/applications | Employer/Admin | List job applications |
| GET | /admin/health | Admin | Health check |
| GET | /admin/audit-logs | Admin | List audit logs |
| GET | /admin/metrics | Admin | Get metrics |

## Quality Checklist

Before submitting backend changes:

- [ ] Uses `Mapped[]` type hints (SQLAlchemy 2.0 style)
- [ ] Enums defined as `str, enum.Enum` subclasses
- [ ] Response schemas use `AliasChoices` for snake_case → camelCase
- [ ] `model_config = ConfigDict(from_attributes=True, populate_by_name=True)`
- [ ] Pagination returns `{ items, page, pageSize, total }`
- [ ] Status transitions validated against TRANSITIONS dict
- [ ] Idempotency-Key header required for POST /applications
- [ ] Cache invalidated on create/update (`invalidate_jobs_cache()`)
- [ ] Audit logs created for state-changing actions
- [ ] `require_roles()` applied to protected routes
- [ ] Errors use `detail=` string (not dict)
- [ ] Redis operations wrapped in try/except (non-fatal)
