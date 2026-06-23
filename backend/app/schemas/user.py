import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.models.user import UserRole, UserStatus


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: UserRole
    status: UserStatus
    created_at: datetime


class UserUpdate(BaseModel):
    full_name: str | None = None
    password: str | None = None


class UserAdminCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.CITIZEN

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserAdminUpdate(BaseModel):
    full_name: str | None = None
    role: UserRole | None = None
    status: UserStatus | None = None


class PaginatedUsers(BaseModel):
    items: list[UserOut]
    total: int
    limit: int
    offset: int
