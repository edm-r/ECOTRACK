import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id:            Mapped[uuid.UUID]      = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_id:      Mapped[uuid.UUID | None]= mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action:        Mapped[str]            = mapped_column(String(80), nullable=False)
    resource_type: Mapped[str | None]     = mapped_column(String(60), nullable=True)
    resource_id:   Mapped[uuid.UUID | None]= mapped_column(UUID(as_uuid=True), nullable=True)
    ip:            Mapped[str | None]     = mapped_column(String(45), nullable=True)
    details:       Mapped[dict | None]    = mapped_column(JSONB, nullable=True)
    created_at:    Mapped[datetime]       = mapped_column(DateTime, nullable=False, server_default=func.now())

    actor: Mapped["User"] = relationship("User", back_populates="audit_logs")
