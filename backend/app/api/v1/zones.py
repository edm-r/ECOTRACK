import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.user import User, UserRole
from app.schemas.zone import ZoneCreate, ZoneOut, ZoneStats, ZoneUpdate
from app.services import zone_service

router = APIRouter()


@router.get("", response_model=list[ZoneOut])
async def get_zones(
    _: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    return await zone_service.list_zones(db)


@router.post(
    "",
    response_model=ZoneOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_zone(
    payload: ZoneCreate,
    _: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    return await zone_service.create_zone(payload, db)


@router.patch("/{zone_id}", response_model=ZoneOut)
async def update_zone(
    zone_id: uuid.UUID,
    payload: ZoneUpdate,
    _: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    result = await zone_service.update_zone(zone_id, payload, db)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zone non trouvée",
        )
    return result


@router.get("/{zone_id}/stats", response_model=ZoneStats)
async def get_zone_stats(
    zone_id: uuid.UUID,
    _: Annotated[
        User,
        Depends(require_role(UserRole.MANAGER, UserRole.ADMIN)),
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    result = await zone_service.get_zone_stats(zone_id, db)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zone non trouvée",
        )
    return result
