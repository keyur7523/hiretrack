from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.cache import get_cached, invalidate_jobs_cache, set_cached
from app.db import get_session
from app.deps import get_current_user, require_roles
from app.models import User, UserRole
from app.schemas import JobCreate, JobResponse, JobUpdate, PaginatedResponse
from app.services.jobs import create_job, get_job, list_jobs, update_job

router = APIRouter(prefix='/jobs', tags=['jobs'])


@router.get('', response_model=PaginatedResponse)
async def list_jobs_endpoint(
    query: str | None = None,
    location: str | None = None,
    company: str | None = None,
    page: int | None = None,
    pageSize: int | None = None,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    user_key = str(user.id) if user.role == UserRole.employer else 'global'
    cache_key = f"jobs:list:{user.role.value}:{user_key}:{query or ''}:{location or ''}:{company or ''}:{page or 1}:{pageSize or 10}"
    cached = await get_cached(cache_key)
    if cached is not None:
        return cached

    items, page, page_size, total = await list_jobs(
        session,
        user=user,
        query=query,
        location=location,
        company=company,
        page=page,
        page_size=pageSize,
    )
    response_items = [JobResponse.model_validate(item).model_dump(by_alias=True) for item in items]
    response = PaginatedResponse(items=response_items, page=page, pageSize=page_size, total=total).model_dump()
    await set_cached(cache_key, response)
    return response


@router.get('/{job_id}', response_model=JobResponse)
async def get_job_endpoint(
    job_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    user_key = str(user.id) if user.role == UserRole.employer else 'global'
    cache_key = f"jobs:detail:{user.role.value}:{user_key}:{job_id}"
    cached = await get_cached(cache_key)
    if cached is not None:
        return cached
    job = await get_job(session, job_id=job_id, user=user)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Job not found')
    response = JobResponse.model_validate(job).model_dump(by_alias=True)
    await set_cached(cache_key, response)
    return response


@router.post('', response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job_endpoint(
    payload: JobCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_roles(UserRole.employer, UserRole.admin)),
):
    job = await create_job(
        session,
        user=user,
        data={
            'title': payload.title,
            'company': payload.company,
            'location': payload.location,
            'description': payload.description,
            'employment_type': payload.employmentType,
            'remote': payload.remote,
            'status': payload.status,
        },
    )
    await session.commit()
    await invalidate_jobs_cache()
    return JobResponse.model_validate(job)


@router.patch('/{job_id}', response_model=JobResponse)
async def update_job_endpoint(
    job_id: UUID,
    payload: JobUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_roles(UserRole.employer, UserRole.admin)),
):
    job = await get_job(session, job_id=job_id, user=user)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Job not found')
    if user.role == UserRole.employer and job.employer_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Forbidden')

    updated = await update_job(
        session,
        job=job,
        user=user,
        data={
            'title': payload.title,
            'company': payload.company,
            'location': payload.location,
            'description': payload.description,
            'employment_type': payload.employmentType,
            'remote': payload.remote,
            'status': payload.status,
        },
    )
    await session.commit()
    await invalidate_jobs_cache()
    return JobResponse.model_validate(updated)
