import logging

import io
from fastapi import APIRouter, Depends, Header, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.config import get_settings
from app.db import get_session
from app.deps import get_current_user, require_roles
from app.models import AIScreening, Application, Job, ScreeningStatus, User, UserRole, StatusHistory
from app.metrics import increment
from app.queue import enqueue
from app.schemas import (
    AIScreeningResult,
    AIScreeningSkillsMatch,
    AIScreeningSummary,
    ApplicationCreate,
    ApplicationDetails,
    ApplicationResponse,
    ApplicationStatusUpdate,
    PaginatedResponse,
)
from app.services.applications import (
    apply_for_job,
    ensure_employer_application_access,
    list_applications,
    update_application_status,
)
from app.services.screening import get_screening_for_application

logger = logging.getLogger(__name__)

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
    increment('application_submissions', 1)
    try:
        await enqueue('application.submitted', {'applicationId': str(application.id), 'jobId': str(application.job_id)})
    except Exception:
        logger.warning('Failed to enqueue application.submitted event for application %s', application.id, exc_info=True)

    # Run AI screening inline (fire-and-forget background task)
    settings = get_settings()
    if settings.ai_screening_enabled and settings.ai_api_key:
        import asyncio
        from app.services.screening import run_screening

        async def _run_screening_bg(app_id):
            from app.db import SessionLocal
            try:
                async with SessionLocal() as bg_session:
                    # Create screening record
                    screening = AIScreening(application_id=app_id, status=ScreeningStatus.pending)
                    bg_session.add(screening)
                    await bg_session.commit()
                    # Run the actual screening
                    await run_screening(bg_session, app_id)
                    await bg_session.commit()
                    logger.info('AI screening completed for application %s', app_id)
            except Exception:
                logger.warning('AI screening failed for application %s', app_id, exc_info=True)

        asyncio.create_task(_run_screening_bg(application.id))

    return ApplicationResponse(
        id=application.id,
        jobId=application.job_id,
        applicantId=application.applicant_id,
        status=application.status,
        createdAt=application.created_at,
        resumeText=application.resume_text,
        coverLetter=application.cover_letter,
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


@router.post('/parse-resume')
async def parse_resume(
    file: UploadFile = File(...),
    user: User = Depends(require_roles(UserRole.applicant)),
):
    """Extract text from an uploaded PDF resume."""
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Only PDF files are accepted')

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='File must be under 5MB')

    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(contents))
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        text = '\n'.join(text_parts).strip()
    except Exception as exc:
        logger.warning('PDF parse failed: %s', exc)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='Could not extract text from PDF') from exc

    if not text:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='No text found in PDF')

    return {'text': text}


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

    # Load AI screening data (gracefully handle missing table)
    screening = None
    try:
        screening = await get_screening_for_application(session, application.id)
    except Exception:
        logger.warning('Failed to load AI screening for application %s', application.id, exc_info=True)
    ai_screening_data = None
    if screening:
        if user.role in (UserRole.employer, UserRole.admin):
            # Full result for employer/admin
            skills_match = None
            if screening.result and 'skills_match' in screening.result:
                sm = screening.result['skills_match']
                skills_match = AIScreeningSkillsMatch(
                    matched=sm.get('matched', []),
                    missing=sm.get('missing', []),
                    bonus=sm.get('bonus', []),
                )
            ai_screening_data = AIScreeningResult(
                status=screening.status.value,
                score=screening.score,
                recommendation=screening.recommendation.value if screening.recommendation else None,
                skillsMatch=skills_match,
                experienceAssessment=screening.result.get('experience_assessment') if screening.result else None,
                strengths=screening.result.get('strengths') if screening.result else None,
                concerns=screening.result.get('concerns') if screening.result else None,
                completedAt=screening.completed_at,
            )
        else:
            # Summary only for applicant
            ai_screening_data = AIScreeningSummary(
                status=screening.status.value,
                score=screening.score,
                recommendation=screening.recommendation.value if screening.recommendation else None,
            )

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
        'aiScreening': ai_screening_data.model_dump(exclude_none=True) if ai_screening_data else None,
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
    increment('status_transitions', 1)
    try:
        await enqueue(
            'application.status_changed',
            {'applicationId': str(updated.id), 'status': updated.status.value},
        )
    except Exception:
        logger.warning('Failed to enqueue application.status_changed event for application %s', updated.id, exc_info=True)
    return ApplicationResponse(
        id=updated.id,
        jobId=updated.job_id,
        applicantId=updated.applicant_id,
        status=updated.status,
        createdAt=updated.created_at,
    )


@router.post('/admin/rescreen-pending', status_code=status.HTTP_200_OK)
async def rescreen_pending_applications(
    session: AsyncSession = Depends(get_session),
):
    """Trigger AI screening for all pending applications. Temporary admin utility."""
    import asyncio
    from app.services.screening import run_screening
    from app.db import SessionLocal

    settings = get_settings()
    if not settings.ai_screening_enabled or not settings.ai_api_key:
        raise HTTPException(status_code=400, detail='AI screening not configured')

    stmt = select(AIScreening).where(AIScreening.status.in_([ScreeningStatus.pending, ScreeningStatus.failed]))
    pending = (await session.execute(stmt)).scalars().all()

    async def _screen(app_id):
        try:
            async with SessionLocal() as bg_session:
                await run_screening(bg_session, app_id)
                await bg_session.commit()
                logger.info('Re-screening completed for %s', app_id)
        except Exception:
            logger.warning('Re-screening failed for %s', app_id, exc_info=True)

    count = 0
    for screening in pending:
        asyncio.create_task(_screen(screening.application_id))
        count += 1

    return {'message': f'Triggered re-screening for {count} applications'}
