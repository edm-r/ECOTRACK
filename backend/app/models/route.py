import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RouteStatus(str, enum.Enum):
    DRAFT       = "DRAFT"
    ASSIGNED    = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    DONE        = "DONE"
    CANCELLED   = "CANCELLED"


class RouteStepStatus(str, enum.Enum):
    PENDING = "PENDING"
    DONE    = "DONE"
    SKIPPED = "SKIPPED"
    ISSUE   = "ISSUE"


class Route(Base):
    __tablename__ = "routes"

    id:                 Mapped[uuid.UUID]      = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zone_id:            Mapped[uuid.UUID | None]= mapped_column(UUID(as_uuid=True), ForeignKey("zones.id"), nullable=True)
    agent_id:           Mapped[uuid.UUID | None]= mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    scheduled_date:     Mapped[date]            = mapped_column(Date, nullable=False)
    status:             Mapped[RouteStatus]     = mapped_column(Enum(RouteStatus, name="route_status"), nullable=False, default=RouteStatus.DRAFT)
    estimated_distance: Mapped[float | None]    = mapped_column(Float, nullable=True)
    created_by:         Mapped[uuid.UUID | None]= mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at:         Mapped[datetime]        = mapped_column(DateTime, nullable=False, server_default=func.now())

    zone:  Mapped["Zone"] = relationship("Zone", back_populates="routes")
    agent: Mapped["User"] = relationship("User", foreign_keys=[agent_id], back_populates="routes_agent")
    steps: Mapped[list["RouteStep"]] = relationship("RouteStep", back_populates="route", order_by="RouteStep.step_order", cascade="all, delete-orphan")


class RouteStep(Base):
    __tablename__ = "route_steps"

    id:           Mapped[uuid.UUID]         = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id:     Mapped[uuid.UUID]         = mapped_column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    container_id: Mapped[uuid.UUID]         = mapped_column(UUID(as_uuid=True), ForeignKey("containers.id"), nullable=False)
    step_order:   Mapped[int]               = mapped_column(Integer, nullable=False)
    status:       Mapped[RouteStepStatus]   = mapped_column(Enum(RouteStepStatus, name="route_step_status"), nullable=False, default=RouteStepStatus.PENDING)
    collected_at: Mapped[datetime | None]   = mapped_column(DateTime, nullable=True)
    volume_l:     Mapped[int | None]        = mapped_column(Integer, nullable=True)

    route:     Mapped["Route"]     = relationship("Route",     back_populates="steps")
    container: Mapped["Container"] = relationship("Container", back_populates="route_steps")
