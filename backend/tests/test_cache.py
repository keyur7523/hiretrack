import pytest

from app.db import get_redis
from app.models import Job


async def register_and_login(client, email, role):
    await client.post('/auth/register', json={"email": email, "password": "password123", "role": role})
    login = await client.post('/auth/login', json={"email": email, "password": "password123"})
    data = login.json()
    return data['accessToken'], data['user']['id']


@pytest.mark.asyncio
async def test_jobs_list_cache_hit(client, session):
    redis_client = get_redis()
    token, user_id = await register_and_login(client, 'cache-employer@example.com', 'employer')
    headers = {'Authorization': f'Bearer {token}'}

    job_resp = await client.post(
        '/jobs',
        json={
            "title": "Cache Role",
            "company": "Acme",
            "location": "Remote",
            "description": "Cache",
            "employmentType": "full_time",
            "remote": True,
            "status": "active",
        },
        headers=headers,
    )
    job_id = job_resp.json()['id']

    list_resp = await client.get('/jobs', headers=headers)
    assert list_resp.status_code == 200

    cache_key = f"jobs:list:employer:{user_id}::::1:10"
    cached = await redis_client.get(cache_key)
    assert cached is not None

    await session.execute(Job.__table__.delete().where(Job.id == job_id))
    await session.commit()

    cached_resp = await client.get('/jobs', headers=headers)
    assert cached_resp.status_code == 200
    assert cached_resp.json()['total'] == 1


@pytest.mark.asyncio
async def test_jobs_cache_invalidation_on_update(client):
    redis_client = get_redis()
    token, _user_id = await register_and_login(client, 'cache-employer2@example.com', 'employer')
    headers = {'Authorization': f'Bearer {token}'}

    job_resp = await client.post(
        '/jobs',
        json={
            "title": "Cache Role 2",
            "company": "Acme",
            "location": "Remote",
            "description": "Cache",
            "employmentType": "full_time",
            "remote": True,
            "status": "active",
        },
        headers=headers,
    )
    job_id = job_resp.json()['id']

    await client.get('/jobs', headers=headers)
    keys = [key async for key in redis_client.scan_iter(match='jobs:*')]
    assert len(keys) > 0

    await client.patch(
        f'/jobs/{job_id}',
        json={"title": "Updated"},
        headers=headers,
    )

    keys_after = [key async for key in redis_client.scan_iter(match='jobs:*')]
    assert len(keys_after) == 0
