import enum
import uuid
from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ContainerStatus(str, enum.Enum):
    UNKNOWN     = "UNKNOWN"
    NORMAL      = "NORMAL"
    WATCH       = "WATCH"
    CRITICAL    = "CRITICAL"
    MAINTENANCE = "MAINTENANCE"


class Container(Base):
    __tablename__ = "containers"

    id:                Mapped[uuid.UUID]          = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zone_id:           Mapped[uuid.UUID | None]   = mapped_column(UUID(as_uuid=True), ForeignKey("zones.id"), nullable=True)
    qr_code:           Mapped[str]                = mapped_column(String(80), unique=True, nullable=False)
    type:              Mapped[str]                = mapped_column(String(50), nullable=False, default="GENERAL")
    capacity_l:        Mapped[int]                = mapped_column(Integer, nullable=False, default=1000)
    geom:              Mapped[object]             = mapped_column(Geometry("POINT", srid=4326), nullable=False)
    status:            Mapped[ContainerStatus]    = mapped_column(Enum(ContainerStatus, name="container_status"), nullable=False, default=ContainerStatus.UNKNOWN)
    fill_level_latest: Mapped[int | None]         = mapped_column(Integer, nullable=True)
    last_measured_at:  Mapped[datetime | None]    = mapped_column(DateTime, nullable=True)
    created_at:        Mapped[datetime]           = mapped_column(DateTime, nullable=False, server_default=func.now())

    zone:         Mapped["Zone"]                = relationship("Zone",          back_populates="containers")
    measurements: Mapped[list["IotMeasurement"]]= relationship("IotMeasurement",back_populates="container", lazy="select")
    reports:      Mapped[list["Report"]]        = relationship("Report",        back_populates="container", lazy="select")
    route_steps:  Mapped[list["RouteStep"]]     = relationship("RouteStep",     back_populates="container", lazy="select")
