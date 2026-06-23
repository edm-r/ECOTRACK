import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.session import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.gamification import PointsEvent
from app.models.user import User, UserRole
from app.schemas.user import (
    PaginatedUsers,
    UserAdminCreate,
    UserAdminUpdate,
    UserOut,
    UserUpdate,
)
from app.services import admin_service

router = APIRouter()

Admin = Annotated[User, Depends(require_role(UserRole.ADMIN))]


# ── Current-user endpoints (all authenticated) ────────────────────────────


@router.get("/me", response_model=UserOut)
async def read_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    return current_user


@router.patch("/me", response_model=UserOut)
async def update_me(
    payload: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.password is not None:
        if len(payload.password) < 8:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Le mot de passe doit contenir au moins 8 caractères",
            )
        current_user.password_hash = hash_password(payload.password)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.get("/me/points")
async def read_my_points(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    result = await db.execute(
        select(PointsEvent)
        .where(PointsEvent.user_id == current_user.id)
        .order_by(PointsEvent.created_at.desc())
    )
    events = result.scalars().all()
    total = sum(e.points for e in events)
    return {
        "total_points": total,
        "events": [
            {
                "id": str(e.id),
                "points": e.points,
                "reason": e.reason,
                "created_at": e.created_at.isoformat(),
            }
            for e in events
        ],
    }


# ── Admin endpoints ───────────────────────────────────────────────────────


@router.get("", response_model=PaginatedUsers)
async def list_users(
    role: str | None = Query(default=None),
    user_status: str | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: Admin = ...,
    db: AsyncSession = Depends(get_db),
) -> dict:
    from app.models.user import UserRole as UR, UserStatus as US

    role_enum = None
    if role is not None:
        try:
            role_enum = UR(role)
        except ValueError:
            raise HTTPException(
                status_code=422, detail=f"Invalid role: {role}"
            )

    status_enum = None
    if user_status is not None:
        try:
            status_enum = US(user_status)
        except ValueError:
            raise HTTPException(
                status_code=422, detail=f"Invalid status: {user_status}"
            )

    return await admin_service.list_users(
        db, role=role_enum, status=status_enum, search=search,
        limit=limit, offset=offset,
    )


@router.post("", response_model=UserOut, status_code=201)
async def create_user(
    data: UserAdminCreate,
    current_user: Admin,
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        return await admin_service.create_user_admin(data, current_user.id, db)
    except ValueError as exc:
        if "already registered" in str(exc):
            raise HTTPException(status_code=409, detail=str(exc))
        raise HTTPException(status_code=422, detail=str(exc))


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: uuid.UUID,
    data: UserAdminUpdate,
    current_user: Admin,
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        return await admin_service.update_user_admin(
            user_id, data, current_user.id, db
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{user_id}", status_code=204)
async def deactivate_user(
    user_id: uuid.UUID,
    current_user: Admin,
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await admin_service.deactivate_user(user_id, current_user.id, db)
    except ValueError as exc:
        code = 409 if "yourself" in str(exc) else 404
        raise HTTPException(status_code=code, detail=str(exc))
