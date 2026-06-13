import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class KpiDashboard(BaseModel):
    containers_total: int
    containers_critical: int
    containers_watch: int
    containers_normal: int
    containers_unknown: int
    alerts_open: int
    reports_open: int
    reports_resolved_7d: int
    routes_active: int
    routes_completed_7d: int
    avg_fill_level: float
    co2_estimated_kg_7d: float


class TimeseriesPoint(BaseModel):
    ts: datetime
    value: float


class TimeseriesResponse(BaseModel):
    points: list[TimeseriesPoint]


class TopZone(BaseModel):
    zone_id: uuid.UUID
    zone_name: str
    container_count: int
    avg_fill_level: float | None
    critical_count: int


class TopZonesResponse(BaseModel):
    zones: list[TopZone]


class HeatmapCell(BaseModel):
    lat: float
    lng: float
    weight: int


class HeatmapResponse(BaseModel):
    cells: list[HeatmapCell]


class PredictionPoint(BaseModel):
    horizon_h: int
    predicted_fill: float
    confidence_low: float
    confidence_high: float


class PredictionResponse(BaseModel):
    container_id: uuid.UUID
    current_fill: float | None
    predictions: list[PredictionPoint]


class ExportRequest(BaseModel):
    format: str = Field(default="csv", pattern="^(csv|pdf)$")
    zone_id: Optional[uuid.UUID] = None
    status: Optional[str] = None
    from_date: Optional[date] = None
    to_date: Optional[date] = None
