import json
import pytest

from app.queue import QUEUE_KEY, DLQ_KEY
from app import worker
from app.db import get_redis


async def register_and_login(client, email, role):
    await client.post('/auth/register', json={"email": email, "password": "password123", "role": role})
    login = await client.post('/auth/login', json={"email": email, "password": "password123"})
    return login.json()['accessToken']


@pytest.mark.asyncio
async def test_enqueue_on_application_submit(client):
    redis_client = get_redis()
    employer_token = await register_and_login(client, 'queue-employer@example.com', 'employer')
    job_resp = await client.post(
        '/jobs',
        json={
            "title": "Queue Role",
            "company": "Acme",
            "location": "Remote",
            "description": "Queue",
            "employmentType": "full_time",
            "remote": True,
            "status": "active",
        },
        headers={'Authorization': f'Bearer {employer_token}'},
    )
    job_id = job_resp.json()['id']

    applicant_token = await register_and_login(client, 'queue-applicant@example.com', 'applicant')
    await client.post(
        '/applications',
        json={"jobId": job_id, "resumeText": "Resume", "coverLetter": "Cover"},
        headers={'Authorization': f'Bearer {applicant_token}', 'Idempotency-Key': 'queue-1'},
    )

    items = await redis_client.lrange(QUEUE_KEY, 0, -1)
    assert len(items) == 1
    task = json.loads(items[0])
    assert task['type'] == 'application.submitted'


@pytest.mark.asyncio
async def test_worker_retry_and_dlq(client, monkeypatch):
    redis_client = get_redis()
    await redis_client.delete(QUEUE_KEY)
    await redis_client.delete(DLQ_KEY)

    async def failing_handler(_session, _payload):
        raise RuntimeError('fail')

    monkeypatch.setitem(worker.TASK_HANDLERS, 'application.submitted', failing_handler)
    monkeypatch.setattr(worker, 'BACKOFF_SECONDS', [0, 0, 0])

    await redis_client.rpush(QUEUE_KEY, json.dumps({
        'id': 'task-1',
        'type': 'application.submitted',
        'payload': {'applicationId': '1'},
        'attempts': 0,
    }))

    await worker.process_once()
    queued = await redis_client.lrange(QUEUE_KEY, 0, -1)
    assert len(queued) == 1
    task = json.loads(queued[0])
    assert task['attempts'] == 1

    await worker.process_once()
    await worker.process_once()

    dlq_items = await redis_client.lrange(DLQ_KEY, 0, -1)
    assert len(dlq_items) == 1
    assert await redis_client.llen(QUEUE_KEY) == 0
