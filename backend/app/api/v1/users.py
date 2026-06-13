from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.session import get_db
from app.middleware.auth import get_current_user
from app.models.gamification import PointsEvent
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate

router = APIRouter()


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
        select(PointsEvent).where(
            PointsEvent.user_id == current_user.id
        ).order_by(PointsEvent.created_at.desc())
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
