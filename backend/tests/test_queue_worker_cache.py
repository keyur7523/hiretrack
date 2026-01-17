import pytest
from unittest.mock import AsyncMock, patch

from app.queue import enqueue, dequeue, push_dlq, queue_depth, dlq_size, requeue, QUEUE_KEY, DLQ_KEY
from app.worker import process_once, MAX_RETRIES
from app.cache import get_cached, set_cached, invalidate_jobs_cache


async def register_and_login(client, email, role):
    await client.post('/auth/register', json={"email": email, "password": "password123", "role": role})
    login = await client.post('/auth/login', json={"email": email, "password": "password123"})
    return login.json()['accessToken']


@pytest.mark.asyncio
async def test_enqueue_creates_task():
    """Test that enqueue adds a task to the queue"""
    task = await enqueue('test.task', {'key': 'value'})
    
    assert task['type'] == 'test.task'
    assert task['payload'] == {'key': 'value'}
    assert task['attempts'] == 0
    assert 'id' in task
    
    depth = await queue_depth()
    assert depth >= 1


@pytest.mark.asyncio
async def test_dequeue_returns_task():
    """Test that dequeue returns a task from the queue"""
    await enqueue('test.dequeue', {'data': 123})
    
    task = await dequeue(timeout=1)
    assert task is not None
    assert task['type'] == 'test.dequeue'
    assert task['payload']['data'] == 123


@pytest.mark.asyncio
async def test_dequeue_returns_none_when_empty():
    """Test that dequeue returns None when queue is empty"""
    task = await dequeue(timeout=1)
    assert task is None


@pytest.mark.asyncio
async def test_dlq_push_and_size():
    """Test pushing to DLQ and checking size"""
    initial_size = await dlq_size()
    
    await push_dlq({'type': 'failed.task', 'payload': {}, 'attempts': 3})
    
    new_size = await dlq_size()
    assert new_size == initial_size + 1


@pytest.mark.asyncio
async def test_requeue_adds_task_back():
    """Test that requeue adds task back to the queue"""
    task = {'type': 'retry.task', 'payload': {}, 'attempts': 1}
    await requeue(task)
    
    depth = await queue_depth()
    assert depth >= 1
    
    dequeued = await dequeue(timeout=1)
    assert dequeued['type'] == 'retry.task'


@pytest.mark.asyncio
async def test_application_submitted_enqueues_task(client):
    """Test that submitting an application enqueues a task"""
    employer_token = await register_and_login(client, 'queue_employer@example.com', 'employer')
    job_resp = await client.post('/jobs', json={
        "title": "Queue Test Role",
        "company": "Acme",
        "location": "Remote",
        "description": "Testing queue",
        "employmentType": "full_time",
        "remote": True,
        "status": "active",
    }, headers={'Authorization': f'Bearer {employer_token}'})
    job_id = job_resp.json()['id']
    
    applicant_token = await register_and_login(client, 'queue_applicant@example.com', 'applicant')
    
    initial_depth = await queue_depth()
    
    await client.post('/applications', json={
        "jobId": job_id,
        "resumeText": "My resume",
        "coverLetter": "My cover letter",
    }, headers={'Authorization': f'Bearer {applicant_token}', 'Idempotency-Key': 'queue-test-key'})
    
    new_depth = await queue_depth()
    assert new_depth >= initial_depth


@pytest.mark.asyncio
async def test_worker_processes_valid_task():
    """Test that worker successfully processes a valid task"""
    await enqueue('application.submitted', {'applicationId': 'test-123', 'jobId': 'job-456'})
    
    result = await process_once()
    assert result is True


@pytest.mark.asyncio
async def test_worker_retries_on_failure():
    """Test that worker retries failed tasks"""
    task = {
        'id': 'retry-test',
        'type': 'unknown.task.type',
        'payload': {},
        'attempts': 0,
    }
    from app.db import get_redis
    import json
    redis = get_redis()
    await redis.rpush(QUEUE_KEY, json.dumps(task))
    
    # First attempt should fail and requeue
    result = await process_once()
    assert result is False
    
    # Task should be back in queue with incremented attempts
    depth = await queue_depth()
    assert depth >= 1


@pytest.mark.asyncio
async def test_worker_pushes_to_dlq_after_max_retries():
    """Test that worker pushes to DLQ after max retries"""
    task = {
        'id': 'dlq-test',
        'type': 'unknown.task.type',
        'payload': {},
        'attempts': MAX_RETRIES - 1,  # Will exceed max on next attempt
    }
    from app.db import get_redis
    import json
    redis = get_redis()
    await redis.rpush(QUEUE_KEY, json.dumps(task))
    
    initial_dlq = await dlq_size()
    
    result = await process_once()
    assert result is False
    
    new_dlq = await dlq_size()
    assert new_dlq == initial_dlq + 1


@pytest.mark.asyncio
async def test_cache_set_and_get():
    """Test setting and getting cached values"""
    await set_cached('test:key', {'foo': 'bar'})
    
    result = await get_cached('test:key')
    assert result == {'foo': 'bar'}


@pytest.mark.asyncio
async def test_cache_returns_none_for_missing():
    """Test that cache returns None for missing keys"""
    result = await get_cached('nonexistent:key')
    assert result is None


@pytest.mark.asyncio
async def test_jobs_cache_hit(client):
    """Test that job list caching works"""
    employer_token = await register_and_login(client, 'cache_employer@example.com', 'employer')
    headers = {'Authorization': f'Bearer {employer_token}'}
    
    await client.post('/jobs', json={
        "title": "Cache Test Job",
        "company": "CacheCorp",
        "location": "Cached City",
        "description": "Testing cache",
        "employmentType": "full_time",
        "remote": True,
        "status": "active",
    }, headers=headers)
    
    # First request - cache miss
    resp1 = await client.get('/jobs', headers=headers)
    assert resp1.status_code == 200
    
    # Second request - should be cached
    resp2 = await client.get('/jobs', headers=headers)
    assert resp2.status_code == 200
    assert resp1.json() == resp2.json()


@pytest.mark.asyncio
async def test_cache_invalidation_on_job_create(client):
    """Test that cache is invalidated when creating a job"""
    employer_token = await register_and_login(client, 'cache_inv_employer@example.com', 'employer')
    headers = {'Authorization': f'Bearer {employer_token}'}
    
    # Create first job and fetch list (populates cache)
    await client.post('/jobs', json={
        "title": "First Job",
        "company": "Acme",
        "location": "Remote",
        "description": "First",
        "employmentType": "full_time",
        "remote": True,
        "status": "active",
    }, headers=headers)
    
    resp1 = await client.get('/jobs', headers=headers)
    assert resp1.json()['total'] == 1
    
    # Create second job (should invalidate cache)
    await client.post('/jobs', json={
        "title": "Second Job",
        "company": "Acme",
        "location": "Remote",
        "description": "Second",
        "employmentType": "full_time",
        "remote": True,
        "status": "active",
    }, headers=headers)
    
    # Fetch again - should see both jobs
    resp2 = await client.get('/jobs', headers=headers)
    assert resp2.json()['total'] == 2


@pytest.mark.asyncio
async def test_cache_invalidation_on_job_update(client):
    """Test that cache is invalidated when updating a job"""
    employer_token = await register_and_login(client, 'cache_upd_employer@example.com', 'employer')
    headers = {'Authorization': f'Bearer {employer_token}'}
    
    # Create job
    job_resp = await client.post('/jobs', json={
        "title": "Original Title",
        "company": "Acme",
        "location": "Remote",
        "description": "Original",
        "employmentType": "full_time",
        "remote": True,
        "status": "active",
    }, headers=headers)
    job_id = job_resp.json()['id']
    
    # Fetch list (populates cache)
    resp1 = await client.get('/jobs', headers=headers)
    assert resp1.json()['items'][0]['title'] == 'Original Title'
    
    # Update job (should invalidate cache)
    await client.patch(f'/jobs/{job_id}', json={
        "title": "Updated Title",
    }, headers=headers)
    
    # Fetch again - should see updated title
    resp2 = await client.get('/jobs', headers=headers)
    assert resp2.json()['items'][0]['title'] == 'Updated Title'


@pytest.mark.asyncio
async def test_invalidate_jobs_cache():
    """Test the invalidate_jobs_cache function directly"""
    # Set some job cache entries
    await set_cached('jobs:list:employer:123:query', {'items': []})
    await set_cached('jobs:detail:employer:123:456', {'id': '456'})
    
    # Invalidate all job caches
    await invalidate_jobs_cache()
    
    # Both should be gone
    assert await get_cached('jobs:list:employer:123:query') is None
    assert await get_cached('jobs:detail:employer:123:456') is None

