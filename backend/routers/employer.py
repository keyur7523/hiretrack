from fastapi import APIRouter, Depends, HTTPException
from fastapi import status as http_status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db import get_session
from app.deps import require_roles
from app.models import ApplicationStatus, User, UserRole
from app.schemas import ApplicationResponse, PaginatedResponse
from app.services.applications import ensure_employer_access, list_applications_for_job

router = APIRouter(prefix='/employer', tags=['employer'])


@router.get('/jobs/{job_id}/applications', response_model=PaginatedResponse)
async def list_job_applications(
    job_id: UUID,
    status: ApplicationStatus | None = None,
    page: int | None = None,
    pageSize: int | None = None,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_roles(UserRole.employer, UserRole.admin)),
):
    job = await ensure_employer_access(session, user=user, job_id=job_id)
    if not job:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail='Job not found')

    items, page_num, page_size, total = await list_applications_for_job(
        session,
        job_id=job_id,
        status=status,
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
    return PaginatedResponse(items=response_items, page=page_num, pageSize=page_size, total=total)
