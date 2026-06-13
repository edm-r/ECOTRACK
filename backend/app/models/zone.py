import uuid
from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Zone(Base):
    __tablename__ = "zones"

    id:         Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name:       Mapped[str]       = mapped_column(String(120), nullable=False)
    priority:   Mapped[int]       = mapped_column(Integer, nullable=False, default=1)
    geom:       Mapped[object]    = mapped_column(Geometry("POLYGON", srid=4326), nullable=False)
    created_at: Mapped[datetime]  = mapped_column(DateTime, nullable=False, server_default=func.now())

    containers: Mapped[list["Container"]] = relationship("Container", back_populates="zone", lazy="select")
    routes:     Mapped[list["Route"]]     = relationship("Route",     back_populates="zone", lazy="select")
