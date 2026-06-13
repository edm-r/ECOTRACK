import uuid
from datetime import datetime

from pydantic import BaseModel


class ZoneOut(BaseModel):
    id: uuid.UUID
    name: str
    priority: int
    geom: dict  # GeoJSON Polygon
    created_at: datetime
    container_count: int = 0


class ZoneCreate(BaseModel):
    name: str
    priority: int = 1
    geom: dict  # GeoJSON Polygon


class ZoneUpdate(BaseModel):
    name: str | None = None
    priority: int | None = None


class ZoneStats(BaseModel):
    zone_id: uuid.UUID
    zone_name: str
    container_count: int
    avg_fill_level: float | None
    critical_count: int
    watch_count: int
    normal_count: int
    unknown_count: int
    maintenance_count: int
