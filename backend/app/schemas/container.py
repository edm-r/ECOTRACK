import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.container import ContainerStatus


class ContainerMapItem(BaseModel):
    id: uuid.UUID
    qr_code: str
    lat: float
    lng: float
    status: ContainerStatus
    fill_level: int | None
    last_measured_at: datetime | None
    zone_id: uuid.UUID | None
    zone_name: str | None


class ContainerOut(BaseModel):
    id: uuid.UUID
    zone_id: uuid.UUID | None
    zone_name: str | None
    qr_code: str
    type: str
    capacity_l: int
    lat: float
    lng: float
    status: ContainerStatus
    fill_level_latest: int | None
    last_measured_at: datetime | None
    created_at: datetime


class ContainerCreate(BaseModel):
    qr_code: str
    type: str = "GENERAL"
    capacity_l: int = Field(default=1000, ge=1)
    lat: float = Field(ge=-90.0, le=90.0)
    lng: float = Field(ge=-180.0, le=180.0)


class ContainerUpdate(BaseModel):
    qr_code: str | None = None
    type: str | None = None
    capacity_l: int | None = Field(default=None, ge=1)
    lat: float | None = Field(default=None, ge=-90.0, le=90.0)
    lng: float | None = Field(default=None, ge=-180.0, le=180.0)


class MeasurementOut(BaseModel):
    id: uuid.UUID
    container_id: uuid.UUID
    fill_level: int
    temperature: float | None
    battery: int | None
    source: str
    measured_at: datetime
