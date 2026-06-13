from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.hash import bcrypt as bcrypt_ctx

from app.core.config import settings


def hash_password(plain: str) -> str:
    return bcrypt_ctx.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt_ctx.verify(plain, hashed)


def create_access_token(subject: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Décode et valide le JWT. Lève JWTError si invalide ou expiré."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
