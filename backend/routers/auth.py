from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, hash_password, verify_password
from app.db import get_session
from app.models import User, UserRole
from app.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.deps import get_current_user
from app.services.audit import create_audit_log

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/register', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, request: Request, session: AsyncSession = Depends(get_session)):
    if payload.role == UserRole.admin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid role')
    if len(payload.password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Password too short')

    existing = await session.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email already registered')

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    session.add(user)
    await session.flush()
    await create_audit_log(
        session,
        actor_id=user.id,
        action='auth.register',
        entity_type='auth',
        entity_id=user.id,
        metadata={'email': user.email, 'role': user.role.value},
    )
    await session.commit()
    request.state.user_id = str(user.id)
    return UserResponse.model_validate(user)


@router.post('/login', response_model=TokenResponse)
async def login(payload: LoginRequest, request: Request, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

    token = create_access_token(user_id=user.id, email=user.email, role=user.role.value)
    await create_audit_log(
        session,
        actor_id=user.id,
        action='auth.login',
        entity_type='auth',
        entity_id=user.id,
        metadata={'email': user.email},
    )
    await session.commit()
    request.state.user_id = str(user.id)
    return TokenResponse(accessToken=token, user=UserResponse.model_validate(user))


@router.get('/me', response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
