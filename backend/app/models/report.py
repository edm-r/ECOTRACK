import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ReportType(str, enum.Enum):
    FULL    = "FULL"
    DAMAGED = "DAMAGED"
    BLOCKED = "BLOCKED"
    OTHER   = "OTHER"


class ReportStatus(str, enum.Enum):
    OPEN      = "OPEN"
    CONFIRMED = "CONFIRMED"
    RESOLVED  = "RESOLVED"
    REJECTED  = "REJECTED"


class Report(Base):
    __tablename__ = "reports"

    id:           Mapped[uuid.UUID]    = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id:      Mapped[uuid.UUID]    = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    container_id: Mapped[uuid.UUID]    = mapped_column(UUID(as_uuid=True), ForeignKey("containers.id"), nullable=False)
    type:         Mapped[ReportType]   = mapped_column(Enum(ReportType,   name="report_type"),   nullable=False)
    status:       Mapped[ReportStatus] = mapped_column(Enum(ReportStatus, name="report_status"), nullable=False, default=ReportStatus.OPEN)
    comment:      Mapped[str | None]   = mapped_column(Text, nullable=True)
    created_at:   Mapped[datetime]     = mapped_column(DateTime, nullable=False, server_default=func.now())

    user:      Mapped["User"]      = relationship("User",      back_populates="reports")
    container: Mapped["Container"] = relationship("Container", back_populates="reports")
