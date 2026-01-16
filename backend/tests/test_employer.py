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
