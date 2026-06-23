import uuid
from datetime import datetime, timedelta, timezone

from pydantic import BaseModel, Field, field_validator


class MeasurementIn(BaseModel):
    container_id: uuid.UUID
    fill_level: int = Field(ge=0, le=100)
    temperature: float | None = None
    battery: int | None = Field(default=None, ge=0, le=100)
    source: str = Field(default="http", max_length=50)
    measured_at: datetime | None = None

    @field_validator("measured_at")
    @classmethod
    def not_future(cls, v: datetime | None) -> datetime | None:
        if v is None:
            return v
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        if v > datetime.now(timezone.utc) + timedelta(seconds=60):
            raise ValueError("measured_at cannot be in the future")
        return v
