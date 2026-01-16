from datetime import timedelta
from uuid import UUID
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_redis
from app.models import Application, ApplicationStatus, Job, JobStatus, StatusHistory, User, UserRole
from app.services.audit import create_audit_log
from app.utils import paginate


TRANSITIONS: dict[ApplicationStatus, set[ApplicationStatus]] = {
    ApplicationStatus.applied: {ApplicationStatus.reviewed, ApplicationStatus.rejected},
    ApplicationStatus.reviewed: {ApplicationStatus.interview, ApplicationStatus.rejected},
    ApplicationStatus.interview: {ApplicationStatus.accepted, ApplicationStatus.rejected},
    ApplicationStatus.accepted: set(),
    ApplicationStatus.rejected: set(),
}


async def apply_for_job(
    session: AsyncSession,
    *,
    user: User,
    job_id: UUID,
    resume_text: str,
    cover_letter: str | None,
    idempotency_key: str,
) -> Application:
    redis_client = get_redis()
    key = f'idem:{user.id}:{idempotency_key}'
    existing_id = await redis_client.get(key)
    if existing_id:
        existing = await session.get(Application, UUID(existing_id))
        if existing:
            return existing

    job = await session.get(Job, job_id)
    if not job or job.status != JobStatus.active:
        raise ValueError('job_not_active')

    existing = await session.execute(
        select(Application).where(Application.job_id == job_id, Application.applicant_id == user.id)
    )
    if existing.scalar_one_or_none():
        raise ValueError('application_exists')

    application = Application(
        job_id=job_id,
        applicant_id=user.id,
        resume_text=resume_text,
        cover_letter=cover_letter,
        status=ApplicationStatus.applied,
    )
    session.add(application)
    try:
        await session.flush()
    except IntegrityError as exc:
        raise ValueError('application_exists') from exc

    status_history = StatusHistory(
        application_id=application.id,
        status=ApplicationStatus.applied,
        changed_by=user.id,
    )
    session.add(status_history)

    await create_audit_log(
        session,
        actor_id=user.id,
        action='application.created',
        entity_type='application',
        entity_id=application.id,
        metadata={'jobId': str(job_id), 'applicationId': str(application.id)},
    )

    await redis_client.setex(key, int(timedelta(hours=24).total_seconds()), str(application.id))
    return application


async def list_applications(
    session: AsyncSession,
    *,
    user: User,
    page: int | None,
    page_size: int | None,
) -> tuple[list[Application], int, int, int]:
    page, page_size = paginate(page, page_size)
    stmt = select(Application).where(Application.applicant_id == user.id)
    total_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(total_stmt)).scalar_one()
    items = (await session.execute(
        stmt.order_by(Application.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()
    return items, page, page_size, total


async def get_application_details(session: AsyncSession, *, application_id: UUID) -> Application | None:
    return await session.get(Application, application_id)


async def list_applications_for_job(
    session: AsyncSession,
    *,
    job_id: UUID,
    status: ApplicationStatus | None,
    page: int | None,
    page_size: int | None,
) -> tuple[list[Application], int, int, int]:
    page, page_size = paginate(page, page_size)
    stmt = select(Application).where(Application.job_id == job_id)
    if status:
        stmt = stmt.where(Application.status == status)
    total_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(total_stmt)).scalar_one()
    items = (await session.execute(
        stmt.order_by(Application.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()
    return items, page, page_size, total


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


async def ensure_employer_access(session: AsyncSession, *, user: User, job_id: UUID) -> Job | None:
    job = await session.get(Job, job_id)
    if not job:
        return None
    if user.role == UserRole.employer and job.employer_id != user.id:
        return None
    return job


async def ensure_employer_application_access(
    session: AsyncSession,
    *,
    user: User,
    application: Application,
) -> bool:
    if user.role == UserRole.admin:
        return True
    job = await session.get(Job, application.job_id)
    return bool(job and job.employer_id == user.id)
