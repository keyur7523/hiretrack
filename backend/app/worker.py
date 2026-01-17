import asyncio
import logging
from typing import Any, Callable

from sqlalchemy.ext.asyncio import AsyncSession

from app.db import SessionLocal
from app.queue import dequeue, push_dlq, requeue
from app.services.audit import create_audit_log

logger = logging.getLogger('hiretrack.worker')

BACKOFF_SECONDS = [1, 4, 10]
MAX_RETRIES = 3


async def handle_application_submitted(session: AsyncSession, payload: dict[str, Any]) -> None:
    application_id = payload.get('applicationId')
    await create_audit_log(
        session,
        actor_id=None,
        action='application.submitted.async',
        entity_type='application',
        entity_id=application_id,
        metadata={'applicationId': application_id, 'async': True},
    )
    logger.info({'message': 'notification.simulated', 'type': 'application.submitted', 'payload': payload})


async def handle_application_status_changed(session: AsyncSession, payload: dict[str, Any]) -> None:
    application_id = payload.get('applicationId')
    await create_audit_log(
        session,
        actor_id=None,
        action='application.status_changed.async',
        entity_type='application',
        entity_id=application_id,
        metadata={'applicationId': application_id, 'async': True, 'status': payload.get('status')},
    )
    logger.info({'message': 'notification.simulated', 'type': 'application.status_changed', 'payload': payload})


TASK_HANDLERS: dict[str, Callable[[AsyncSession, dict[str, Any]], Any]] = {
    'application.submitted': handle_application_submitted,
    'application.status_changed': handle_application_status_changed,
}


async def process_task(task: dict[str, Any]) -> None:
    task_type = task.get('type')
    handler = TASK_HANDLERS.get(task_type)
    if not handler:
        raise ValueError(f'Unknown task type: {task_type}')

    async with SessionLocal() as session:
        await handler(session, task.get('payload', {}))
        await session.commit()


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
            logger.error({'message': 'task.failed', 'task': task})
        else:
            delay = BACKOFF_SECONDS[min(attempts - 1, len(BACKOFF_SECONDS) - 1)]
            logger.warning({'message': 'task.retry', 'task': task, 'delay': delay})
            await asyncio.sleep(delay)
            await requeue(task)
        return False


async def run() -> None:
    while True:
        await process_once()


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run())


if __name__ == '__main__':
    main()
