import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class IotMeasurement(Base):
    __tablename__ = "iot_measurements"

    id:           Mapped[uuid.UUID]       = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    container_id: Mapped[uuid.UUID]       = mapped_column(UUID(as_uuid=True), ForeignKey("containers.id"), nullable=False)
    fill_level:   Mapped[int]             = mapped_column(Integer, nullable=False)
    temperature:  Mapped[float | None]    = mapped_column(Float, nullable=True)
    battery:      Mapped[int | None]      = mapped_column(Integer, nullable=True)
    source:       Mapped[str]             = mapped_column(String(50), nullable=False, default="simulator")
    measured_at:  Mapped[datetime]        = mapped_column(DateTime, nullable=False, server_default=func.now())

    container: Mapped["Container"] = relationship("Container", back_populates="measurements")
