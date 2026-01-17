import json
from typing import Any

from app.db import get_redis

CACHE_TTL_SECONDS = 60


async def get_cached(key: str) -> Any | None:
    try:
        redis_client = get_redis()
        raw = await redis_client.get(key)
        if not raw:
            return None
        return json.loads(raw)
    except Exception:
        return None


async def set_cached(key: str, value: Any) -> None:
    try:
        redis_client = get_redis()
        await redis_client.setex(key, CACHE_TTL_SECONDS, json.dumps(value))
    except Exception:
        return None


async def invalidate_jobs_cache() -> None:
    try:
        redis_client = get_redis()
        async for key in redis_client.scan_iter(match='jobs:*'):
            await redis_client.delete(key)
    except Exception:
        return None
