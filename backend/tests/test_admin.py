import pytest
from app.auth import hash_password
from app.models import User, UserRole


async def create_admin(session, email: str):
    admin = User(
        email=email,
        password_hash=hash_password('password123'),
        role=UserRole.admin,
    )
    session.add(admin)
    await session.commit()
    return admin


@pytest.mark.asyncio
async def test_admin_health_degraded_when_redis_down(client, session, monkeypatch):
    email = 'admin-health@example.com'
    await create_admin(session, email)

    login = await client.post('/auth/login', json={"email": email, "password": "password123"})
    token = login.json()['accessToken']

    def broken_redis():
        class Dummy:
            async def ping(self):
                raise RuntimeError('down')
        return Dummy()

    monkeypatch.setattr('routers.admin.get_redis', broken_redis)

    resp = await client.get('/admin/health', headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 200
    data = resp.json()
    assert data['status'] in ['degraded', 'down']


@pytest.mark.asyncio
async def test_admin_audit_logs_filter(client, session):
    email = 'admin-logs@example.com'
    await create_admin(session, email)
    login = await client.post('/auth/login', json={"email": email, "password": "password123"})
    token = login.json()['accessToken']

    await client.post('/auth/register', json={"email": "audit@example.com", "password": "password123", "role": "applicant"})
    logs = await client.get('/admin/audit-logs?action=auth.register', headers={'Authorization': f'Bearer {token}'})
    assert logs.status_code == 200
    assert logs.json()['total'] >= 1
