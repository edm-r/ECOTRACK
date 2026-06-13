import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.middleware.auth import require_role
from app.models.user import User, UserRole
from app.schemas.alert import AlertOut
from app.services.alert_service import acknowledge_alert, list_alerts

router = APIRouter()


@router.get("", response_model=list[AlertOut])
async def get_alerts(
    zone: Optional[uuid.UUID] = None,
    type: Optional[str] = None,
    current_user: Annotated[User, Depends(require_role(UserRole.MANAGER, UserRole.ADMIN))] = ...,
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    if type is not None and type not in ("CRITICAL_FILL", "OPEN_REPORT"):
        raise HTTPException(status_code=422, detail="type must be CRITICAL_FILL or OPEN_REPORT")
    return await list_alerts(db, zone_id=zone, alert_type=type)


@router.post("/{alert_id}/acknowledge", status_code=204)
async def ack_alert(
    alert_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role(UserRole.MANAGER, UserRole.ADMIN))] = ...,
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await acknowledge_alert(alert_id, current_user.id, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
