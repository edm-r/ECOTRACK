import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: uuid.UUID
    actor_id: uuid.UUID | None
    actor_email: str | None
    action: str
    resource_type: str | None
    resource_id: uuid.UUID | None
    ip: str | None
    details: dict[str, Any] | None
    created_at: datetime


class PaginatedAuditLogs(BaseModel):
    items: list[AuditLogOut]
    total: int
    limit: int
    offset: int
