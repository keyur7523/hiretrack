import pytest


async def register_and_login(client, email, role):
    await client.post('/auth/register', json={"email": email, "password": "password123", "role": role})
    login = await client.post('/auth/login', json={"email": email, "password": "password123"})
    return login.json()['accessToken']


@pytest.mark.asyncio
async def test_employer_pipeline_and_status_transition(client):
    employer_token = await register_and_login(client, 'employer5@example.com', 'employer')
    employer_headers = {'Authorization': f'Bearer {employer_token}'}
    job_resp = await client.post('/jobs', json={
        "title": "DevOps",
        "company": "Acme",
        "location": "Remote",
        "description": "Ops",
        "employmentType": "full_time",
        "remote": True,
        "status": "active",
    }, headers=employer_headers)
    job_id = job_resp.json()['id']

    applicant_token = await register_and_login(client, 'applicant4@example.com', 'applicant')
    apply_resp = await client.post('/applications', json={
        "jobId": job_id,
        "resumeText": "Resume",
        "coverLetter": "Cover",
    }, headers={'Authorization': f'Bearer {applicant_token}', 'Idempotency-Key': 'apply1'})
    application_id = apply_resp.json()['id']

    pipeline = await client.get(f'/employer/jobs/{job_id}/applications', headers=employer_headers)
    assert pipeline.status_code == 200
    assert pipeline.json()['total'] == 1

    update_resp = await client.patch(
        f'/applications/{application_id}/status',
        json={"status": "reviewed"},
        headers=employer_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()['status'] == 'reviewed'

    invalid = await client.patch(
        f'/applications/{application_id}/status',
        json={"status": "applied"},
        headers=employer_headers,
    )
    assert invalid.status_code == 409


@pytest.mark.asyncio
async def test_cross_employer_pipeline_access_denied(client):
    """TC-PIPE-02: Cross-employer access to job applications must return 403/404, not 500."""
    # employer1 creates a job
    employer1_token = await register_and_login(client, 'employer_pipe1@example.com', 'employer')
    employer1_headers = {'Authorization': f'Bearer {employer1_token}'}
    job_resp = await client.post('/jobs', json={
        "title": "Job for Pipeline Test",
        "company": "Acme",
        "location": "NYC",
        "description": "Test job",
        "employmentType": "full_time",
        "remote": False,
        "status": "active",
    }, headers=employer1_headers)
    assert job_resp.status_code == 201
    job_id = job_resp.json()['id']

    # employer2 tries to access employer1's job applications
    employer2_token = await register_and_login(client, 'employer_pipe2@example.com', 'employer')
    employer2_headers = {'Authorization': f'Bearer {employer2_token}'}
    
    # This should return 403 or 404, NOT 500
    resp = await client.get(f'/employer/jobs/{job_id}/applications', headers=employer2_headers)
    
    # Accept either 403 (Forbidden) or 404 (Not Found) - both are valid for access control
    assert resp.status_code in (403, 404), f"Expected 403/404 but got {resp.status_code}"
