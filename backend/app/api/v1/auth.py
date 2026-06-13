import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import JWTError
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, decode_refresh_token
from app.db.session import get_db
from app.middleware.auth import get_current_user
from app.models.user import User, UserRole
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.user import UserOut
from app.services.audit_service import log_event
from app.services.auth_service import (
    authenticate,
    build_token_response,
    create_user,
    get_user_by_email,
    get_user_by_id,
)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: RegisterRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    existing = await get_user_by_email(payload.email, db)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email déjà utilisé",
        )

    user = await create_user(payload, db, role=UserRole.CITIZEN)

    await log_event(
        action="USER_REGISTER",
        db=db,
        actor_id=user.id,
        resource_type="user",
        resource_id=user.id,
        ip=request.client.host if request.client else None,
    )

    return build_token_response(user)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/5minute")
async def login(
    payload: LoginRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    user = await authenticate(payload.email, payload.password, db)
    if user is None:
        await log_event(
            action="LOGIN_FAILED",
            db=db,
            ip=request.client.host if request.client else None,
            details={"email": payload.email},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )

    await log_event(
        action="LOGIN_SUCCESS",
        db=db,
        actor_id=user.id,
        resource_type="user",
        resource_id=user.id,
        ip=request.client.host if request.client else None,
    )

    return build_token_response(user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    payload: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    try:
        user_id_str = decode_refresh_token(payload.refresh_token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await get_user_by_id(uuid.UUID(user_id_str), db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable",
        )

    return build_token_response(user)


@router.get("/me", response_model=UserOut)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    return current_user
