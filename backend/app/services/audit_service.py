import uuid
from typing import Optional, Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


async def log_event(
    action: str,
    db: AsyncSession,
    actor_id: Optional[uuid.UUID] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[uuid.UUID] = None,
    ip: Optional[str] = None,
    details: Optional[dict[str, Any]] = None,
) -> None:
    entry = AuditLog(
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip=ip,
        details=details,
    )
    db.add(entry)
    await db.commit()
