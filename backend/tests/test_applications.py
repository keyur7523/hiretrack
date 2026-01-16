import pytest


async def register_and_login(client, email, role):
    await client.post('/auth/register', json={"email": email, "password": "password123", "role": role})
    login = await client.post('/auth/login', json={"email": email, "password": "password123"})
    return login.json()['accessToken']


@pytest.mark.asyncio
async def test_application_idempotency(client):
    employer_token = await register_and_login(client, 'employer3@example.com', 'employer')
    employer_headers = {'Authorization': f'Bearer {employer_token}'}
    job_resp = await client.post('/jobs', json={
        "title": "Data Analyst",
        "company": "Acme",
        "location": "Remote",
        "description": "Analyze",
        "employmentType": "full_time",
        "remote": True,
        "status": "active",
    }, headers=employer_headers)
    job_id = job_resp.json()['id']

    applicant_token = await register_and_login(client, 'applicant2@example.com', 'applicant')
    headers = {'Authorization': f'Bearer {applicant_token}', 'Idempotency-Key': 'abc123'}
    apply_resp = await client.post('/applications', json={
        "jobId": job_id,
        "resumeText": "Resume",
        "coverLetter": "Cover",
    }, headers=headers)
    assert apply_resp.status_code == 201

    apply_repeat = await client.post('/applications', json={
        "jobId": job_id,
        "resumeText": "Resume",
        "coverLetter": "Cover",
    }, headers=headers)
    assert apply_repeat.status_code == 201
    assert apply_repeat.json()['id'] == apply_resp.json()['id']


@pytest.mark.asyncio
async def test_application_duplicate_conflict(client):
    employer_token = await register_and_login(client, 'employer4@example.com', 'employer')
    employer_headers = {'Authorization': f'Bearer {employer_token}'}
    job_resp = await client.post('/jobs', json={
        "title": "QA",
        "company": "Acme",
        "location": "Remote",
        "description": "Test",
        "employmentType": "full_time",
        "remote": True,
        "status": "active",
    }, headers=employer_headers)
    job_id = job_resp.json()['id']

    applicant_token = await register_and_login(client, 'applicant3@example.com', 'applicant')
    headers = {'Authorization': f'Bearer {applicant_token}'}
    first = await client.post('/applications', json={
        "jobId": job_id,
        "resumeText": "Resume",
        "coverLetter": "Cover",
    }, headers={**headers, 'Idempotency-Key': 'key1'})
    assert first.status_code == 201

    second = await client.post('/applications', json={
        "jobId": job_id,
        "resumeText": "Resume",
        "coverLetter": "Cover",
    }, headers={**headers, 'Idempotency-Key': 'key2'})
    assert second.status_code == 409
