import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserRole(str, enum.Enum):
    CITIZEN = "CITIZEN"
    AGENT   = "AGENT"
    MANAGER = "MANAGER"
    ADMIN   = "ADMIN"


class UserStatus(str, enum.Enum):
    ACTIVE   = "ACTIVE"
    INACTIVE = "INACTIVE"


class User(Base):
    __tablename__ = "users"

    id:            Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email:         Mapped[str]       = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str]       = mapped_column(String, nullable=False)
    full_name:     Mapped[str]       = mapped_column(String(255), nullable=False)
    role:          Mapped[UserRole]  = mapped_column(Enum(UserRole, name="user_role"), nullable=False)
    status:        Mapped[UserStatus]= mapped_column(Enum(UserStatus, name="user_status"), nullable=False, default=UserStatus.ACTIVE)
    created_at:    Mapped[datetime]  = mapped_column(DateTime, nullable=False, server_default=func.now())

    reports:      Mapped[list["Report"]]      = relationship("Report",      back_populates="user",    lazy="select")
    points_events:Mapped[list["PointsEvent"]] = relationship("PointsEvent", back_populates="user",    lazy="select")
    routes_agent: Mapped[list["Route"]]       = relationship("Route",       foreign_keys="Route.agent_id", back_populates="agent", lazy="select")
    audit_logs:   Mapped[list["AuditLog"]]    = relationship("AuditLog",    back_populates="actor",   lazy="select")
