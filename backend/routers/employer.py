from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import status as http_status
from sqlalchemy import cast, func, select, outerjoin, Date
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db import get_session
from app.deps import require_roles
from app.models import AIScreening, Application, ApplicationStatus, Job, User, UserRole
from app.schemas import PaginatedResponse
from app.services.applications import ensure_employer_access, list_applications_for_job
from app.utils import paginate

router = APIRouter(prefix='/employer', tags=['employer'])


@router.get('/analytics')
async def get_employer_analytics(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_roles(UserRole.employer)),
):
    """Dashboard analytics for the employer's jobs and applications."""
    employer_jobs = select(Job.id).where(Job.employer_id == user.id).scalar_subquery()

    # Summary: total jobs
    total_jobs = (await session.execute(
        select(func.count()).select_from(Job).where(Job.employer_id == user.id)
    )).scalar() or 0

    # Summary: total applications across employer's jobs
    total_apps = (await session.execute(
        select(func.count()).select_from(Application).where(Application.job_id.in_(employer_jobs))
    )).scalar() or 0

    # Summary: average AI score
    avg_score_result = (await session.execute(
        select(func.round(func.avg(AIScreening.score)))
        .join(Application, AIScreening.application_id == Application.id)
        .where(Application.job_id.in_(employer_jobs))
        .where(AIScreening.score.isnot(None))
    )).scalar()
    avg_ai_score = int(avg_score_result) if avg_score_result is not None else 0

    # Status breakdown
    status_rows = (await session.execute(
        select(Application.status, func.count())
        .where(Application.job_id.in_(employer_jobs))
        .group_by(Application.status)
    )).all()
    status_breakdown = [{'status': row[0].value, 'count': row[1]} for row in status_rows]

    # Top jobs by application count (top 8)
    top_jobs_rows = (await session.execute(
        select(
            Job.id, Job.title, Job.company,
            func.count(Application.id).label('app_count'),
            func.round(func.avg(AIScreening.score)).label('avg_score'),
        )
        .join(Application, Application.job_id == Job.id)
        .outerjoin(AIScreening, AIScreening.application_id == Application.id)
        .where(Job.employer_id == user.id)
        .group_by(Job.id, Job.title, Job.company)
        .order_by(func.count(Application.id).desc())
        .limit(8)
    )).all()
    top_jobs = [
        {
            'jobId': str(row[0]),
            'title': row[1],
            'company': row[2],
            'applicationCount': row[3],
            'avgAiScore': int(row[4]) if row[4] is not None else None,
        }
        for row in top_jobs_rows
    ]

    # Applications over time (by date)
    time_rows = (await session.execute(
        select(
            cast(Application.created_at, Date).label('date'),
            func.count().label('count'),
        )
        .where(Application.job_id.in_(employer_jobs))
        .group_by(cast(Application.created_at, Date))
        .order_by(cast(Application.created_at, Date))
    )).all()
    applications_over_time = [
        {'date': row[0].isoformat(), 'count': row[1]}
        for row in time_rows
    ]

    # AI score distribution (buckets of 20)
    score_rows = (await session.execute(
        select(AIScreening.score)
        .join(Application, AIScreening.application_id == Application.id)
        .where(Application.job_id.in_(employer_jobs))
        .where(AIScreening.score.isnot(None))
    )).scalars().all()

    buckets = {'0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0}
    for score in score_rows:
        if score <= 20:
            buckets['0-20'] += 1
        elif score <= 40:
            buckets['21-40'] += 1
        elif score <= 60:
            buckets['41-60'] += 1
        elif score <= 80:
            buckets['61-80'] += 1
        else:
            buckets['81-100'] += 1
    score_distribution = [{'range': k, 'count': v} for k, v in buckets.items()]

    return {
        'summary': {
            'totalJobs': total_jobs,
            'totalApplications': total_apps,
            'avgAiScore': avg_ai_score,
        },
        'statusBreakdown': status_breakdown,
        'topJobs': top_jobs,
        'applicationsOverTime': applications_over_time,
        'scoreDistribution': score_distribution,
    }


@router.get('/jobs/{job_id}/applications', response_model=PaginatedResponse)
async def list_job_applications(
    job_id: UUID,
    status: ApplicationStatus | None = None,
    sort_by: str | None = Query(default=None, alias='sortBy'),
    min_score: int | None = Query(default=None, alias='minScore'),
    page: int | None = None,
    pageSize: int | None = None,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_roles(UserRole.employer, UserRole.admin)),
):
    job = await ensure_employer_access(session, user=user, job_id=job_id)
    if not job:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail='Job not found')

    # If no special sort/filter, use the existing service
    if not sort_by and min_score is None:
        items, page_num, page_size, total = await list_applications_for_job(
            session,
            job_id=job_id,
            status=status,
            page=page,
            page_size=pageSize,
        )
        # Fetch screening scores for these items
        app_ids = [item.id for item in items]
        screenings = {}
        if app_ids:
            stmt = select(AIScreening).where(AIScreening.application_id.in_(app_ids))
            results = (await session.execute(stmt)).scalars().all()
            screenings = {s.application_id: s for s in results}

        response_items = []
        for item in items:
            s = screenings.get(item.id)
            response_items.append({
                'id': str(item.id),
                'jobId': str(item.job_id),
                'applicantId': str(item.applicant_id),
                'status': item.status.value,
                'createdAt': item.created_at.isoformat(),
                'aiScreeningScore': s.score if s else None,
                'aiScreeningStatus': s.status.value if s else None,
            })
        return PaginatedResponse(items=response_items, page=page_num, pageSize=page_size, total=total)

    # Build custom query with sort/filter by AI score
    p, ps = paginate(page, pageSize)
    offset = (p - 1) * ps

    base_query = (
        select(Application, AIScreening)
        .outerjoin(AIScreening, AIScreening.application_id == Application.id)
        .where(Application.job_id == job_id)
    )
    if status:
        base_query = base_query.where(Application.status == status)
    if min_score is not None:
        base_query = base_query.where(AIScreening.score >= min_score)

    # Count
    from sqlalchemy import func
    count_query = select(func.count()).select_from(base_query.subquery())
    total = (await session.execute(count_query)).scalar() or 0

    # Sort
    if sort_by == 'ai_score':
        base_query = base_query.order_by(AIScreening.score.desc().nulls_last())
    else:
        base_query = base_query.order_by(Application.created_at.desc())

    base_query = base_query.offset(offset).limit(ps)
    rows = (await session.execute(base_query)).all()

    response_items = []
    for app, screening in rows:
        response_items.append({
            'id': str(app.id),
            'jobId': str(app.job_id),
            'applicantId': str(app.applicant_id),
            'status': app.status.value,
            'createdAt': app.created_at.isoformat(),
            'aiScreeningScore': screening.score if screening else None,
            'aiScreeningStatus': screening.status.value if screening else None,
        })
    return PaginatedResponse(items=response_items, page=p, pageSize=ps, total=total)
