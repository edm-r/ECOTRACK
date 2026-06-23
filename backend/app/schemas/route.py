import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.route import RouteStatus, RouteStepStatus


class RouteStepOut(BaseModel):
    id: uuid.UUID
    step_order: int
    container_id: uuid.UUID
    qr_code: str
    lat: float
    lng: float
    status: RouteStepStatus
    collected_at: datetime | None


class RouteOut(BaseModel):
    id: uuid.UUID
    zone_id: uuid.UUID | None
    zone_name: str | None
    agent_id: uuid.UUID | None
    agent_name: str | None
    scheduled_date: date
    status: RouteStatus
    estimated_distance: float | None
    steps: list[RouteStepOut]
    created_at: datetime


class RouteCreate(BaseModel):
    zone_id: uuid.UUID
    scheduled_date: date
    fill_threshold: int = Field(default=70, ge=0, le=100)


class RouteOptimizeRequest(BaseModel):
    zone_id: uuid.UUID
    fill_threshold: int = Field(default=70, ge=0, le=100)
    date: Optional[date] = None


class OptimizeStep(BaseModel):
    container_id: uuid.UUID
    qr_code: str
    lat: float
    lng: float
    fill_level: int | None
    status: str


class RouteOptimizeResponse(BaseModel):
    ordered_steps: list[OptimizeStep]
    estimated_distance_km: float
    container_count: int
