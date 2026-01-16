from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
import redis.asyncio as redis

from app.config import get_settings


class Base(DeclarativeBase):
    pass


settings = get_settings()
engine = create_async_engine(settings.database_url, echo=False, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

redis_client: redis.Redis | None = None


def init_redis() -> None:
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(settings.redis_url, decode_responses=True)


def get_redis() -> redis.Redis:
    if redis_client is None:
        init_redis()
    return redis_client  # type: ignore[return-value]


async def close_redis() -> None:
    if redis_client is not None:
        await redis_client.close()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
