from typing import Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog


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
