import pytest


@pytest.mark.asyncio
async def test_register_login_me(client):
    payload = {"email": "user1@example.com", "password": "password123", "role": "applicant"}
    resp = await client.post('/auth/register', json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data['email'] == payload['email']
    assert data['role'] == payload['role']

    login = await client.post('/auth/login', json={"email": payload['email'], "password": payload['password']})
    assert login.status_code == 200
    token = login.json()['accessToken']

    me = await client.get('/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert me.status_code == 200
    assert me.json()['email'] == payload['email']
