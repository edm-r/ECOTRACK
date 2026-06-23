import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User, UserRole
from app.services.auth_service import get_user_by_id

bearer_scheme = HTTPBearer(auto_error=True)

_401 = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Token invalide ou expiré",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = uuid.UUID(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise _401

    user = await get_user_by_id(user_id, db)
    if user is None:
        raise _401
    return user


def require_role(*roles: UserRole):
    async def dependency(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission insuffisante",
            )
        return current_user

    return dependency
