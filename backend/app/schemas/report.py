import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.report import ReportStatus, ReportType


class ReportIn(BaseModel):
    container_id: uuid.UUID
    type: ReportType
    comment: str | None = None


class ReportOut(BaseModel):
    id: uuid.UUID
    container_id: uuid.UUID
    user_id: uuid.UUID
    type: ReportType
    status: ReportStatus
    comment: str | None
    created_at: datetime


class ReportStatusUpdate(BaseModel):
    status: ReportStatus
