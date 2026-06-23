import json
import uuid
from typing import Any, Optional

from geoalchemy2.elements import WKTElement
from shapely.geometry import shape as to_shapely
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.zone import Zone
from app.schemas.zone import ZoneCreate, ZoneUpdate


def _geom_to_dict(v: Any) -> dict:
    if isinstance(v, dict):
        return v
    return json.loads(v)


_SELECT_ZONE = """
    SELECT
        z.id,
        z.name,
        z.priority,
        z.created_at,
        ST_AsGeoJSON(z.geom) AS geom,
        COUNT(c.id)::int AS container_count
    FROM zones z
    LEFT JOIN containers c ON c.zone_id = z.id
    WHERE {where}
    GROUP BY z.id
    ORDER BY z.priority DESC, z.name
"""


async def list_zones(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        text(_SELECT_ZONE.format(where="1=1"))
    )
    rows = result.mappings().all()
    out = []
    for r in rows:
        d = dict(r)
        d["geom"] = _geom_to_dict(d["geom"])
        out.append(d)
    return out


async def get_zone(
    zone_id: uuid.UUID, db: AsyncSession
) -> Optional[dict]:
    result = await db.execute(
        text(_SELECT_ZONE.format(where="z.id = :zone_id")),
        {"zone_id": str(zone_id)},
    )
    row = result.mappings().first()
    if not row:
        return None
    d = dict(row)
    d["geom"] = _geom_to_dict(d["geom"])
    return d


async def create_zone(
    data: ZoneCreate, db: AsyncSession
) -> dict:
    shp = to_shapely(data.geom)
    zone = Zone(
        name=data.name,
        priority=data.priority,
        geom=WKTElement(shp.wkt, srid=4326),
    )
    db.add(zone)
    await db.commit()
    zone_id = zone.id
    result = await get_zone(zone_id, db)
    assert result is not None
    return result


async def update_zone(
    zone_id: uuid.UUID,
    data: ZoneUpdate,
    db: AsyncSession,
) -> Optional[dict]:
    result = await db.execute(
        select(Zone).where(Zone.id == zone_id)
    )
    zone = result.scalar_one_or_none()
    if not zone:
        return None
    if data.name is not None:
        zone.name = data.name
    if data.priority is not None:
        zone.priority = data.priority
    await db.commit()
    return await get_zone(zone_id, db)


async def get_zone_stats(
    zone_id: uuid.UUID, db: AsyncSession
) -> Optional[dict]:
    result = await db.execute(
        text("""
        SELECT
            z.id AS zone_id,
            z.name AS zone_name,
            COUNT(c.id)::int AS container_count,
            AVG(c.fill_level_latest)::float AS avg_fill_level,
            COUNT(c.id) FILTER (
                WHERE c.status = 'CRITICAL'
            )::int AS critical_count,
            COUNT(c.id) FILTER (
                WHERE c.status = 'WATCH'
            )::int AS watch_count,
            COUNT(c.id) FILTER (
                WHERE c.status = 'NORMAL'
            )::int AS normal_count,
            COUNT(c.id) FILTER (
                WHERE c.status = 'UNKNOWN'
            )::int AS unknown_count,
            COUNT(c.id) FILTER (
                WHERE c.status = 'MAINTENANCE'
            )::int AS maintenance_count
        FROM zones z
        LEFT JOIN containers c ON c.zone_id = z.id
        WHERE z.id = :zone_id
        GROUP BY z.id, z.name
        """),
        {"zone_id": str(zone_id)},
    )
    row = result.mappings().first()
    if not row:
        return None
    return dict(row)
