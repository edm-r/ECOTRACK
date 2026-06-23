import uuid
from datetime import datetime
from typing import Optional

from geoalchemy2.elements import WKTElement
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.container import Container, ContainerStatus
from app.schemas.container import ContainerCreate, ContainerUpdate

_SELECT_CONTAINER = """
    SELECT
        c.id, c.qr_code, c.type, c.capacity_l, c.status,
        c.fill_level_latest, c.last_measured_at,
        c.zone_id, c.created_at,
        ST_Y(c.geom::geometry) AS lat,
        ST_X(c.geom::geometry) AS lng,
        z.name AS zone_name
    FROM containers c
    LEFT JOIN zones z ON z.id = c.zone_id
"""


def _to_container_out(r: dict) -> dict:
    return {
        "id": r["id"],
        "qr_code": r["qr_code"],
        "type": r["type"],
        "capacity_l": r["capacity_l"],
        "lat": float(r["lat"]),
        "lng": float(r["lng"]),
        "status": r["status"],
        "fill_level_latest": r["fill_level_latest"],
        "last_measured_at": r["last_measured_at"],
        "zone_id": r["zone_id"],
        "zone_name": r["zone_name"],
        "created_at": r["created_at"],
    }


async def get_container(
    container_id: uuid.UUID, db: AsyncSession
) -> Optional[dict]:
    result = await db.execute(
        text(f"{_SELECT_CONTAINER} WHERE c.id = :cid"),
        {"cid": str(container_id)},
    )
    row = result.mappings().first()
    if not row:
        return None
    return _to_container_out(dict(row))


async def list_containers_map(db: AsyncSession) -> dict:
    result = await db.execute(text(f"""
        SELECT
            c.id, c.qr_code, c.status, c.fill_level_latest,
            c.last_measured_at, c.zone_id,
            ST_Y(c.geom::geometry) AS lat,
            ST_X(c.geom::geometry) AS lng,
            z.name AS zone_name
        FROM containers c
        LEFT JOIN zones z ON z.id = c.zone_id
        ORDER BY c.qr_code
    """))
    rows = result.mappings().all()
    items = [
        {
            "id": r["id"],
            "qr_code": r["qr_code"],
            "lat": float(r["lat"]),
            "lng": float(r["lng"]),
            "status": r["status"],
            "fill_level": r["fill_level_latest"],
            "last_measured_at": r["last_measured_at"],
            "zone_id": r["zone_id"],
            "zone_name": r["zone_name"],
        }
        for r in rows
    ]
    return {"items": items, "total": len(items)}


async def list_containers(
    db: AsyncSession,
    zone_id: Optional[uuid.UUID] = None,
    status: Optional[ContainerStatus] = None,
    min_fill: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> dict:
    where: list[str] = ["1=1"]
    params: dict = {}

    if zone_id is not None:
        where.append("c.zone_id = :zone_id")
        params["zone_id"] = str(zone_id)
    if status is not None:
        where.append("c.status = :status")
        params["status"] = status.value
    if min_fill is not None:
        where.append("c.fill_level_latest >= :min_fill")
        params["min_fill"] = min_fill
    if search:
        where.append(
            "(c.qr_code ILIKE :search OR z.name ILIKE :search)"
        )
        params["search"] = f"%{search}%"

    clause = " AND ".join(where)

    total_result = await db.execute(
        text(f"""
        SELECT COUNT(*)::int AS total
        FROM containers c
        LEFT JOIN zones z ON z.id = c.zone_id
        WHERE {clause}
        """),
        params,
    )
    total = total_result.scalar_one()

    params["limit"] = limit
    params["offset"] = offset
    result = await db.execute(
        text(f"""
        {_SELECT_CONTAINER}
        WHERE {clause}
        ORDER BY c.qr_code
        LIMIT :limit OFFSET :offset
        """),
        params,
    )
    rows = result.mappings().all()
    items = [_to_container_out(dict(r)) for r in rows]
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


async def _zone_for_point(
    lat: float, lng: float, db: AsyncSession
) -> Optional[uuid.UUID]:
    result = await db.execute(
        text("""
        SELECT id FROM zones
        WHERE ST_Contains(
            geom,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
        )
        LIMIT 1
        """),
        {"lng": lng, "lat": lat},
    )
    row = result.first()
    return row[0] if row else None


async def create_container(
    data: ContainerCreate, db: AsyncSession
) -> dict:
    zone_id = await _zone_for_point(data.lat, data.lng, db)
    container = Container(
        zone_id=zone_id,
        qr_code=data.qr_code,
        type=data.type,
        capacity_l=data.capacity_l,
        geom=WKTElement(
            f"POINT({data.lng} {data.lat})", srid=4326
        ),
        status=ContainerStatus.UNKNOWN,
    )
    db.add(container)
    await db.commit()
    result = await get_container(container.id, db)
    assert result is not None
    return result


async def update_container(
    container_id: uuid.UUID,
    data: ContainerUpdate,
    db: AsyncSession,
) -> Optional[dict]:
    result = await db.execute(
        select(Container).where(Container.id == container_id)
    )
    container = result.scalar_one_or_none()
    if not container:
        return None

    if data.qr_code is not None:
        container.qr_code = data.qr_code
    if data.type is not None:
        container.type = data.type
    if data.capacity_l is not None:
        container.capacity_l = data.capacity_l

    if data.lat is not None or data.lng is not None:
        current = await get_container(container_id, db)
        assert current is not None
        lat = data.lat if data.lat is not None else current["lat"]
        lng = data.lng if data.lng is not None else current["lng"]
        container.geom = WKTElement(
            f"POINT({lng} {lat})", srid=4326
        )
        container.zone_id = await _zone_for_point(lat, lng, db)

    await db.commit()
    return await get_container(container_id, db)


async def soft_delete_container(
    container_id: uuid.UUID, db: AsyncSession
) -> bool:
    result = await db.execute(
        select(Container).where(Container.id == container_id)
    )
    container = result.scalar_one_or_none()
    if not container:
        return False
    container.status = ContainerStatus.MAINTENANCE
    await db.commit()
    return True


async def list_measurements(
    container_id: uuid.UUID,
    db: AsyncSession,
    from_dt: Optional[datetime] = None,
    to_dt: Optional[datetime] = None,
    limit: int = 200,
) -> list[dict]:
    where = ["m.container_id = :cid"]
    params: dict = {"cid": str(container_id)}

    if from_dt:
        where.append("m.measured_at >= :from_dt")
        params["from_dt"] = from_dt
    if to_dt:
        where.append("m.measured_at <= :to_dt")
        params["to_dt"] = to_dt

    params["limit"] = limit

    result = await db.execute(
        text(f"""
        SELECT
            id, container_id, fill_level, temperature,
            battery, source, measured_at
        FROM iot_measurements m
        WHERE {" AND ".join(where)}
        ORDER BY measured_at DESC
        LIMIT :limit
        """),
        params,
    )
    return [dict(r) for r in result.mappings().all()]
