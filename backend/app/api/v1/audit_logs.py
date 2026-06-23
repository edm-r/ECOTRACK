import uuid
from datetime import datetime, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.middleware.auth import require_role
from app.models.user import User, UserRole
from app.schemas.audit_log import PaginatedAuditLogs
from app.services.admin_service import list_audit_logs

router = APIRouter()

Admin = Annotated[User, Depends(require_role(UserRole.ADMIN))]


@router.get("", response_model=PaginatedAuditLogs)
async def get_audit_logs(
    actor: Optional[uuid.UUID] = Query(default=None),
    action: Optional[str] = Query(default=None),
    from_date: Optional[str] = Query(default=None, alias="from"),
    to_date: Optional[str] = Query(default=None, alias="to"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: Admin = ...,
    db: AsyncSession = Depends(get_db),
) -> dict:
    from fastapi import HTTPException

    now = datetime.now(timezone.utc)
    try:
        from_dt = datetime.fromisoformat(from_date) if from_date else None
        to_dt = datetime.fromisoformat(to_date) if to_date else None
    except ValueError:
        raise HTTPException(
            status_code=422, detail="Invalid date format, use ISO 8601"
        )

    if from_dt and from_dt.tzinfo is None:
        from_dt = from_dt.replace(tzinfo=timezone.utc)
    if to_dt and to_dt.tzinfo is None:
        to_dt = to_dt.replace(tzinfo=timezone.utc)

    return await list_audit_logs(
        db,
        actor_filter=actor,
        action_filter=action,
        from_dt=from_dt,
        to_dt=to_dt,
        limit=limit,
        offset=offset,
    )
