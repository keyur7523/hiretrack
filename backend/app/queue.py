import json
import uuid
from typing import Any

from app.db import get_redis

QUEUE_KEY = 'queue:tasks'
DLQ_KEY = 'queue:dlq'


async def enqueue(task_type: str, payload: dict[str, Any]) -> dict[str, Any]:
    """Redis list-based queue using RPUSH/BLPOP for durability."""
    task = {
        'id': str(uuid.uuid4()),
        'type': task_type,
        'payload': payload,
        'attempts': 0,
    }
    redis_client = get_redis()
    await redis_client.rpush(QUEUE_KEY, json.dumps(task))
    return task


async def dequeue(timeout: int = 5) -> dict[str, Any] | None:
    redis_client = get_redis()
    item = await redis_client.blpop(QUEUE_KEY, timeout=timeout)
    if not item:
        return None
    _, raw = item
    return json.loads(raw)


async def push_dlq(task: dict[str, Any]) -> None:
    redis_client = get_redis()
    await redis_client.rpush(DLQ_KEY, json.dumps(task))


async def queue_depth() -> int:
    redis_client = get_redis()
    return int(await redis_client.llen(QUEUE_KEY))


async def dlq_size() -> int:
    redis_client = get_redis()
    return int(await redis_client.llen(DLQ_KEY))


async def requeue(task: dict[str, Any]) -> None:
    redis_client = get_redis()
    await redis_client.rpush(QUEUE_KEY, json.dumps(task))
