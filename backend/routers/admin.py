from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db import get_redis, get_session
from app.deps import require_roles
from app.metrics import snapshot
from app.models import AuditLog, UserRole
from app.queue import dlq_size, queue_depth
from app.schemas import HealthComponent, HealthResponse, PaginatedResponse, AuditLogResponse
from app.utils import paginate

router = APIRouter(prefix='/admin', tags=['admin'])


@router.get('/health', response_model=HealthResponse)
async def health_check(
    session: AsyncSession = Depends(get_session),
    _user=Depends(require_roles(UserRole.admin)),
):
    components: list[HealthComponent] = []
    db_ok = False
    redis_ok = False
    queue_ok = False
    dlq_count = 0

    try:
        await session.execute(select(1))
        db_ok = True
    except Exception:
        db_ok = False
    components.append(HealthComponent(name='db', status='ok' if db_ok else 'down'))

    try:
        redis_client = get_redis()
        await redis_client.ping()
        redis_ok = True
    except Exception:
        redis_ok = False
    components.append(HealthComponent(name='redis', status='ok' if redis_ok else 'down'))

    if redis_ok:
        try:
            dlq_count = await dlq_size()
            queue_ok = dlq_count == 0
        except Exception:
            queue_ok = False
    components.append(
        HealthComponent(
            name='queue',
            status='ok' if queue_ok else 'degraded',
            message=f'dlq_size={dlq_count}',
        )
    )

    if db_ok and redis_ok:
        overall = 'ok' if queue_ok else 'degraded'
    elif not db_ok and not redis_ok:
        overall = 'down'
    else:
        overall = 'degraded'

    return HealthResponse(status=overall, components=components)


@router.get('/audit-logs', response_model=PaginatedResponse)
async def list_audit_logs(
    actor: UUID | None = None,
    action: str | None = None,
    page: int | None = None,
    pageSize: int | None = None,
    session: AsyncSession = Depends(get_session),
    _user=Depends(require_roles(UserRole.admin)),
):
    page, page_size = paginate(page, pageSize)
    stmt = select(AuditLog)
    if actor:
        stmt = stmt.where(AuditLog.actor_id == actor)
    if action:
        stmt = stmt.where(AuditLog.action.ilike(f'%{action}%'))

    total_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(total_stmt)).scalar_one()

    items = (await session.execute(
        stmt.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()

    response_items = [AuditLogResponse.model_validate(item).model_dump(by_alias=True) for item in items]
    return PaginatedResponse(items=response_items, page=page, pageSize=page_size, total=total)


@router.get('/metrics')
async def metrics_endpoint(_user=Depends(require_roles(UserRole.admin))):
    data = snapshot()
    try:
        data['queue_depth'] = await queue_depth()
        data['dlq_size'] = await dlq_size()
    except Exception:
        data['queue_depth'] = 0
        data['dlq_size'] = 0
    return data
