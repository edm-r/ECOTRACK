import logging
from datetime import datetime, timezone

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.container import Container, ContainerStatus
from app.models.iot_measurement import IotMeasurement
from app.schemas.container import MeasurementOut
from app.schemas.iot import MeasurementIn
from app.services.status_engine import compute_status

log = logging.getLogger(__name__)


async def ingest_measurement(data: MeasurementIn, db: AsyncSession) -> MeasurementOut:
    result = await db.execute(select(Container).where(Container.id == data.container_id))
    container = result.scalar_one_or_none()
    if container is None:
        raise ValueError(f"Container {data.container_id} not found")
    if container.status == ContainerStatus.MAINTENANCE:
        raise ValueError("Container is under maintenance")

    rep = await db.execute(
        text("SELECT 1 FROM reports WHERE container_id = :cid AND status = 'OPEN' LIMIT 1"),
        {"cid": data.container_id},
    )
    has_open_report = rep.first() is not None

    ts = data.measured_at or datetime.now(timezone.utc)
    ts_naive = ts.replace(tzinfo=None) if ts.tzinfo else ts

    measurement = IotMeasurement(
        container_id=data.container_id,
        fill_level=data.fill_level,
        temperature=data.temperature,
        battery=data.battery,
        source=data.source,
        measured_at=ts_naive,
    )
    db.add(measurement)

    new_status = compute_status(
        latest_fill=data.fill_level,
        recent_critical_report=has_open_report,
        is_disabled=False,
    )
    old_status = container.status
    container.fill_level_latest = data.fill_level
    container.last_measured_at = ts_naive
    container.status = new_status

    await db.commit()
    await db.refresh(measurement)

    if old_status != new_status:
        log.info("container %s: %s → %s", container.qr_code, old_status.value, new_status.value)

    return MeasurementOut(
        id=measurement.id,
        container_id=measurement.container_id,
        fill_level=measurement.fill_level,
        temperature=measurement.temperature,
        battery=measurement.battery,
        source=measurement.source,
        measured_at=measurement.measured_at,
    )
