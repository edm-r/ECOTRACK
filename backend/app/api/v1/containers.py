import uuid
from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.container import ContainerStatus
from app.models.user import User, UserRole
from app.schemas.container import (
    ContainerCreate,
    ContainerOut,
    ContainerUpdate,
    MeasurementOut,
)
from app.services import container_service
from app.services.audit_service import log_event

router = APIRouter()


@router.get("/map")
async def get_containers_map(
    _: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    return await container_service.list_containers_map(db)


@router.get("")
async def get_containers(
    _: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    zone: Optional[uuid.UUID] = Query(None),
    status_filter: Optional[ContainerStatus] = Query(
        None, alias="status"
    ),
    min_fill: Optional[int] = Query(None, ge=0, le=100),
    search: Optional[str] = Query(None, max_length=100),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> dict:
    return await container_service.list_containers(
        db,
        zone_id=zone,
        status=status_filter,
        min_fill=min_fill,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{container_id}",
    response_model=ContainerOut,
)
async def get_container(
    container_id: uuid.UUID,
    _: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    result = await container_service.get_container(container_id, db)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conteneur non trouvé",
        )
    return result


@router.post(
    "",
    response_model=ContainerOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_container(
    payload: ContainerCreate,
    _: Annotated[
        User,
        Depends(require_role(UserRole.MANAGER, UserRole.ADMIN)),
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    return await container_service.create_container(payload, db)


@router.patch(
    "/{container_id}",
    response_model=ContainerOut,
)
async def update_container(
    container_id: uuid.UUID,
    payload: ContainerUpdate,
    current_user: Annotated[
        User,
        Depends(require_role(UserRole.MANAGER, UserRole.ADMIN)),
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    result = await container_service.update_container(
        container_id, payload, db
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conteneur non trouvé",
        )
    await log_event(
        action="CONTAINER_UPDATED",
        db=db,
        actor_id=current_user.id,
        resource_type="container",
        resource_id=container_id,
    )
    return result


@router.delete(
    "/{container_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_container(
    container_id: uuid.UUID,
    current_user: Annotated[
        User,
        Depends(require_role(UserRole.ADMIN)),
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    deleted = await container_service.soft_delete_container(
        container_id, db
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conteneur non trouvé",
        )
    await log_event(
        action="CONTAINER_SOFT_DELETED",
        db=db,
        actor_id=current_user.id,
        resource_type="container",
        resource_id=container_id,
    )


@router.get(
    "/{container_id}/measurements",
    response_model=list[MeasurementOut],
)
async def get_container_measurements(
    container_id: uuid.UUID,
    _: Annotated[
        User,
        Depends(require_role(UserRole.MANAGER, UserRole.ADMIN)),
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
    from_dt: Optional[datetime] = Query(None, alias="from"),
    to_dt: Optional[datetime] = Query(None, alias="to"),
    limit: int = Query(200, ge=1, le=1000),
) -> list[dict]:
    container = await container_service.get_container(container_id, db)
    if not container:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conteneur non trouvé",
        )
    return await container_service.list_measurements(
        container_id, db, from_dt=from_dt, to_dt=to_dt, limit=limit
    )
