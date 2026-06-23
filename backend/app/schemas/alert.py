import uuid
from datetime import datetime

from pydantic import BaseModel


class AlertOut(BaseModel):
    id: uuid.UUID
    type: str  # "CRITICAL_FILL" | "OPEN_REPORT"
    container_id: uuid.UUID
    container_qr: str
    zone_name: str
    fill_level: int | None
    since: datetime
    acknowledged: bool
