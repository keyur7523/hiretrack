from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID
from passlib.context import CryptContext
from jose import jwt

from app.config import get_settings

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


def create_access_token(*, user_id: UUID, email: str, role: str) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {
        'sub': str(user_id),
        'email': email,
        'role': role,
        'exp': expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
