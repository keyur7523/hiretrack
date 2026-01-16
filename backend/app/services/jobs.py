from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.models import Job, JobStatus, User, UserRole
from app.utils import paginate
from app.services.audit import create_audit_log


def apply_job_filters(stmt: Select, *, query: str | None, location: str | None, company: str | None) -> Select:
    if query:
        stmt = stmt.where(or_(Job.title.ilike(f'%{query}%'), Job.description.ilike(f'%{query}%')))
    if location:
        stmt = stmt.where(Job.location.ilike(f'%{location}%'))
    if company:
        stmt = stmt.where(Job.company.ilike(f'%{company}%'))
    return stmt


async def list_jobs(
    session: AsyncSession,
    *,
    user: User,
    query: str | None,
    location: str | None,
    company: str | None,
    page: int | None,
    page_size: int | None,
) -> tuple[list[Job], int, int, int]:
    page, page_size = paginate(page, page_size)
    stmt = select(Job)

    if user.role == UserRole.applicant:
        stmt = stmt.where(Job.status == JobStatus.active)
    elif user.role == UserRole.employer:
        stmt = stmt.where(Job.employer_id == user.id)

    stmt = apply_job_filters(stmt, query=query, location=location, company=company)

    total_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(total_stmt)).scalar_one()

    stmt = stmt.order_by(Job.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    items = (await session.execute(stmt)).scalars().all()
    return items, page, page_size, total


async def get_job(session: AsyncSession, *, job_id: UUID, user: User) -> Job | None:
    stmt = select(Job).where(Job.id == job_id)
    if user.role == UserRole.applicant:
        stmt = stmt.where(Job.status == JobStatus.active)
    elif user.role == UserRole.employer:
        stmt = stmt.where(Job.employer_id == user.id)
    return (await session.execute(stmt)).scalar_one_or_none()


async def create_job(session: AsyncSession, *, user: User, data: dict) -> Job:
    job = Job(
        employer_id=user.id,
        title=data['title'],
        company=data['company'],
        location=data['location'],
        description=data['description'],
        employment_type=data['employment_type'],
        remote=data['remote'],
        status=data['status'],
    )
    session.add(job)
    await session.flush()
    await create_audit_log(
        session,
        actor_id=user.id,
        action='job.created',
        entity_type='job',
        entity_id=job.id,
        metadata={'jobId': str(job.id)},
    )
    return job


async def update_job(session: AsyncSession, *, job: Job, user: User, data: dict) -> Job:
    for key, value in data.items():
        if value is not None:
            setattr(job, key, value)
    await session.flush()
    await create_audit_log(
        session,
        actor_id=user.id,
        action='job.updated',
        entity_type='job',
        entity_id=job.id,
        metadata={'jobId': str(job.id)},
    )
    return job
