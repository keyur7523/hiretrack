import os
import asyncio
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db import Base
from app.main import app
from app.db import get_session, get_redis


@pytest.fixture(scope='session')
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope='session')
async def test_engine():
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise RuntimeError('DATABASE_URL must be set for tests')
    engine = create_async_engine(database_url, future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture()
async def session(test_engine):
    async_session = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)
    async with async_session() as session:
        yield session


@pytest.fixture(autouse=True)
async def override_session(session):
    async def _get_session():
        yield session

    app.dependency_overrides[get_session] = _get_session
    yield
    app.dependency_overrides.pop(get_session, None)


@pytest.fixture(autouse=True)
async def flush_redis():
    redis_client = get_redis()
    await redis_client.flushdb()
    yield


@pytest.fixture()
async def client():
    async with AsyncClient(app=app, base_url='http://test') as client:
        yield client
