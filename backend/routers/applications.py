from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db import get_session
from app.deps import get_current_user, require_roles
from app.models import Application, Job, User, UserRole, StatusHistory
from app.schemas import ApplicationCreate, ApplicationDetails, ApplicationResponse, ApplicationStatusUpdate, PaginatedResponse
from app.services.applications import (
    apply_for_job,
    ensure_employer_application_access,
    list_applications,
    update_application_status,
)

router = APIRouter(prefix='/applications', tags=['applications'])


@router.post('', response_model=ApplicationResponse, response_model_exclude_none=True, status_code=status.HTTP_201_CREATED)
async def create_application(
    payload: ApplicationCreate,
    idempotency_key: str | None = Header(default=None, alias='Idempotency-Key'),
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_roles(UserRole.applicant)),
):
    if not idempotency_key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Idempotency-Key required')

    try:
        application = await apply_for_job(
            session,
            user=user,
            job_id=payload.jobId,
            resume_text=payload.resumeText,
            cover_letter=payload.coverLetter,
            idempotency_key=idempotency_key,
        )
    except ValueError as exc:
        if str(exc) == 'job_not_active':
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Job not found') from exc
        if str(exc) == 'application_exists':
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Application already exists') from exc
        raise

    await session.commit()
    return ApplicationResponse(
        id=application.id,
        jobId=application.job_id,
        applicantId=application.applicant_id,
        status=application.status,
        createdAt=application.created_at,
    )


@router.get('', response_model=PaginatedResponse)
async def list_my_applications(
    page: int | None = None,
    pageSize: int | None = None,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_roles(UserRole.applicant)),
):
    items, page, page_size, total = await list_applications(
        session,
        user=user,
        page=page,
        page_size=pageSize,
    )
    response_items = [
        ApplicationResponse(
            id=item.id,
            jobId=item.job_id,
            applicantId=item.applicant_id,
            status=item.status,
            createdAt=item.created_at,
        ).model_dump(exclude_none=True)
        for item in items
    ]
    return PaginatedResponse(items=response_items, page=page, pageSize=page_size, total=total)


@router.get('/{application_id}', response_model=ApplicationDetails)
async def get_application_details(
    application_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    application = await session.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Application not found')

    if user.role == UserRole.applicant and application.applicant_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Forbidden')

    if user.role == UserRole.employer:
        allowed = await ensure_employer_application_access(session, user=user, application=application)
        if not allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Forbidden')

    job = await session.get(Job, application.job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Job not found')

    history_rows = (await session.execute(
        select(StatusHistory)
        .where(StatusHistory.application_id == application.id)
        .order_by(StatusHistory.changed_at.asc())
    )).scalars().all()

    status_history = [
        {
            'status': item.status,
            'changedAt': item.changed_at,
            'changedBy': item.changed_by,
        }
        for item in history_rows
    ]

    response = {
        'application': {
            'id': application.id,
            'jobId': application.job_id,
            'applicantId': application.applicant_id,
            'status': application.status,
            'createdAt': application.created_at,
            'resumeText': application.resume_text,
            'coverLetter': application.cover_letter,
        },
        'job': {
            'id': job.id,
            'title': job.title,
            'company': job.company,
            'location': job.location,
        },
        'statusHistory': status_history,
    }
    return response


@router.patch('/{application_id}/status', response_model=ApplicationResponse, response_model_exclude_none=True)
async def update_status(
    application_id: UUID,
    payload: ApplicationStatusUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_roles(UserRole.employer, UserRole.admin)),
):
    application = await session.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Application not found')

    if user.role == UserRole.employer:
        allowed = await ensure_employer_application_access(session, user=user, application=application)
        if not allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Forbidden')

    try:
        updated = await update_application_status(
            session,
            application=application,
            new_status=payload.status,
            actor=user,
        )
    except ValueError as exc:
        if str(exc) == 'invalid_transition':
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Invalid status transition') from exc
        raise

    await session.commit()
    return ApplicationResponse(
        id=updated.id,
        jobId=updated.job_id,
        applicantId=updated.applicant_id,
        status=updated.status,
        createdAt=updated.created_at,
    )
