import pytest


async def register_and_login(client, email, role):
    await client.post('/auth/register', json={"email": email, "password": "password123", "role": role})
    login = await client.post('/auth/login', json={"email": email, "password": "password123"})
    return login.json()['accessToken']


@pytest.mark.asyncio
async def test_employer_create_and_list_jobs(client):
    employer_token = await register_and_login(client, 'employer@example.com', 'employer')
    headers = {'Authorization': f'Bearer {employer_token}'}

    job_payload = {
        "title": "Backend Engineer",
        "company": "Acme",
        "location": "Remote",
        "description": "Build APIs",
        "employmentType": "full_time",
        "remote": True,
        "status": "active",
    }
    resp = await client.post('/jobs', json=job_payload, headers=headers)
    assert resp.status_code == 201

    list_resp = await client.get('/jobs', headers=headers)
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert data['total'] == 1
    assert data['items'][0]['title'] == 'Backend Engineer'

    other_token = await register_and_login(client, 'employer-other@example.com', 'employer')
    other_list = await client.get('/jobs', headers={'Authorization': f'Bearer {other_token}'})
    assert other_list.status_code == 200
    assert other_list.json()['total'] == 0


@pytest.mark.asyncio
async def test_applicant_lists_active_jobs_only(client):
    employer_token = await register_and_login(client, 'employer2@example.com', 'employer')
    headers = {'Authorization': f'Bearer {employer_token}'}

    await client.post('/jobs', json={
        "title": "Active Role",
        "company": "Acme",
        "location": "Remote",
        "description": "Active",
        "employmentType": "full_time",
        "remote": True,
        "status": "active",
    }, headers=headers)

    await client.post('/jobs', json={
        "title": "Archived Role",
        "company": "Acme",
        "location": "Remote",
        "description": "Archived",
        "employmentType": "full_time",
        "remote": True,
        "status": "archived",
    }, headers=headers)

    applicant_token = await register_and_login(client, 'applicant@example.com', 'applicant')
    list_resp = await client.get('/jobs', headers={'Authorization': f'Bearer {applicant_token}'})
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert data['total'] == 1
    assert data['items'][0]['title'] == 'Active Role'
