import logging
import uuid
from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.route import Route, RouteStatus, RouteStep, RouteStepStatus
from app.models.user import UserRole
from app.schemas.route import (
    OptimizeStep,
    RouteCreate,
    RouteOptimizeRequest,
    RouteOptimizeResponse,
    RouteOut,
    RouteStepOut,
)
from app.services.route_optimizer import ContainerPoint as OptimizerPoint
from app.services.route_optimizer import optimize

log = logging.getLogger(__name__)


# ── query helpers ──────────────────────────────────────────────────────────────

_STEP_SQL = """
    SELECT rs.id, rs.route_id, rs.step_order, rs.status, rs.collected_at,
           c.id AS container_id, c.qr_code,
           ST_Y(c.geom::geometry) AS lat,
           ST_X(c.geom::geometry) AS lng
    FROM route_steps rs
    JOIN containers c ON c.id = rs.container_id
    WHERE rs.route_id = :rid
    ORDER BY rs.step_order
"""

_ROUTE_SQL = """
    SELECT r.id, r.zone_id, r.agent_id, r.scheduled_date, r.status,
           r.estimated_distance, r.created_at,
           z.name AS zone_name,
           u.full_name AS agent_name
    FROM routes r
    LEFT JOIN zones z ON z.id = r.zone_id
    LEFT JOIN users u ON u.id = r.agent_id
    WHERE {where}
    ORDER BY r.scheduled_date DESC, r.created_at DESC
"""


async def _load_steps(route_id: uuid.UUID, db: AsyncSession) -> list[RouteStepOut]:
    rows = (await db.execute(text(_STEP_SQL), {"rid": route_id})).mappings().fetchall()
    return [
        RouteStepOut(
            id=r["id"],
            step_order=r["step_order"],
            container_id=r["container_id"],
            qr_code=r["qr_code"],
            lat=r["lat"],
            lng=r["lng"],
            status=r["status"],
            collected_at=r["collected_at"],
        )
        for r in rows
    ]


async def _row_to_out(row, db: AsyncSession) -> RouteOut:
    steps = await _load_steps(row["id"], db)
    return RouteOut(
        id=row["id"],
        zone_id=row["zone_id"],
        zone_name=row["zone_name"],
        agent_id=row["agent_id"],
        agent_name=row["agent_name"],
        scheduled_date=row["scheduled_date"],
        status=row["status"],
        estimated_distance=row["estimated_distance"],
        steps=steps,
        created_at=row["created_at"],
    )


async def _candidates(
    zone_id: uuid.UUID,
    fill_threshold: int,
    db: AsyncSession,
) -> list[OptimizerPoint]:
    rows = await db.execute(
        text("""
            SELECT c.id, c.qr_code, c.fill_level_latest, c.status,
                   ST_Y(c.geom::geometry) AS lat,
                   ST_X(c.geom::geometry) AS lng
            FROM containers c
            WHERE c.zone_id = :zid
              AND c.status != 'MAINTENANCE'
              AND (c.fill_level_latest >= :thresh OR c.status = 'CRITICAL')
            ORDER BY c.fill_level_latest DESC NULLS LAST
        """),
        {"zid": zone_id, "thresh": fill_threshold},
    )
    return [
        OptimizerPoint(
            container_id=str(r.id),
            qr_code=r.qr_code,
            lat=r.lat,
            lng=r.lng,
            fill_level=r.fill_level_latest,
            status=r.status,
        )
        for r in rows.fetchall()
    ]


# ── public API ─────────────────────────────────────────────────────────────────


async def preview_optimize(
    req: RouteOptimizeRequest,
    db: AsyncSession,
) -> RouteOptimizeResponse:
    pts = await _candidates(req.zone_id, req.fill_threshold, db)
    ordered, dist_km = optimize(pts)
    return RouteOptimizeResponse(
        ordered_steps=[
            OptimizeStep(
                container_id=uuid.UUID(p.container_id),
                qr_code=p.qr_code,
                lat=p.lat,
                lng=p.lng,
                fill_level=p.fill_level,
                status=p.status,
            )
            for p in ordered
        ],
        estimated_distance_km=dist_km,
        container_count=len(ordered),
    )


async def create_route(
    req: RouteCreate,
    creator_id: uuid.UUID,
    db: AsyncSession,
) -> RouteOut:
    pts = await _candidates(req.zone_id, req.fill_threshold, db)
    ordered, dist_km = optimize(pts)

    route = Route(
        zone_id=req.zone_id,
        scheduled_date=req.scheduled_date,
        status=RouteStatus.DRAFT,
        estimated_distance=dist_km,
        created_by=creator_id,
    )
    db.add(route)
    await db.flush()

    for i, p in enumerate(ordered):
        step = RouteStep(
            route_id=route.id,
            container_id=uuid.UUID(p.container_id),
            step_order=i + 1,
        )
        db.add(step)

    await db.commit()

    rows = (await db.execute(
        text(_ROUTE_SQL.format(where="r.id = :id")), {"id": route.id}
    )).mappings().fetchall()
    return await _row_to_out(rows[0], db)


async def list_routes(
    db: AsyncSession,
    zone_id: Optional[uuid.UUID] = None,
    limit: int = 50,
    offset: int = 0,
) -> dict:
    where = "1=1"
    params: dict = {}
    if zone_id:
        where = "r.zone_id = :zone_id"
        params["zone_id"] = zone_id

    count = (await db.execute(
        text(f"SELECT COUNT(*) FROM routes r WHERE {where}"), params
    )).scalar_one()

    params["limit"] = limit
    params["offset"] = offset
    sql = _ROUTE_SQL.format(where=where) + " LIMIT :limit OFFSET :offset"
    rows = (await db.execute(text(sql), params)).mappings().fetchall()
    items = [await _row_to_out(r, db) for r in rows]
    return {"items": items, "total": count, "limit": limit, "offset": offset}


async def get_route(route_id: uuid.UUID, db: AsyncSession) -> Optional[RouteOut]:
    rows = (await db.execute(
        text(_ROUTE_SQL.format(where="r.id = :id")), {"id": route_id}
    )).mappings().fetchall()
    if not rows:
        return None
    return await _row_to_out(rows[0], db)


async def list_my_routes(
    agent_id: uuid.UUID,
    today: date,
    db: AsyncSession,
) -> list[RouteOut]:
    rows = (await db.execute(
        text(_ROUTE_SQL.format(where="r.agent_id = :aid AND r.scheduled_date = :today")),
        {"aid": agent_id, "today": today},
    )).mappings().fetchall()
    return [await _row_to_out(r, db) for r in rows]


async def assign_agent(
    route_id: uuid.UUID,
    agent_id: uuid.UUID,
    db: AsyncSession,
) -> RouteOut:
    res = await db.execute(select(Route).where(Route.id == route_id))
    route = res.scalar_one_or_none()
    if route is None:
        raise ValueError("Route not found")
    if route.status not in (RouteStatus.DRAFT, RouteStatus.ASSIGNED):
        raise ValueError(f"Cannot assign agent to a route in status {route.status.value}")
    route.agent_id = agent_id
    route.status = RouteStatus.ASSIGNED
    await db.commit()
    return await get_route(route_id, db)


async def start_route(
    route_id: uuid.UUID,
    agent_id: uuid.UUID,
    db: AsyncSession,
) -> RouteOut:
    res = await db.execute(select(Route).where(Route.id == route_id))
    route = res.scalar_one_or_none()
    if route is None:
        raise ValueError("Route not found")
    if route.agent_id != agent_id:
        raise PermissionError("Not assigned to this route")
    if route.status != RouteStatus.ASSIGNED:
        raise ValueError(f"Route must be ASSIGNED to start, current: {route.status.value}")
    route.status = RouteStatus.IN_PROGRESS
    await db.commit()
    return await get_route(route_id, db)


async def complete_route(
    route_id: uuid.UUID,
    agent_id: uuid.UUID,
    db: AsyncSession,
) -> RouteOut:
    res = await db.execute(select(Route).where(Route.id == route_id))
    route = res.scalar_one_or_none()
    if route is None:
        raise ValueError("Route not found")
    if route.agent_id != agent_id:
        raise PermissionError("Not assigned to this route")
    if route.status != RouteStatus.IN_PROGRESS:
        raise ValueError(f"Route must be IN_PROGRESS to complete, current: {route.status.value}")
    route.status = RouteStatus.DONE
    await db.commit()
    return await get_route(route_id, db)


async def validate_step(
    step_id: uuid.UUID,
    agent_id: uuid.UUID,
    db: AsyncSession,
) -> RouteStepOut:
    step, route = await _get_step_and_route(step_id, db)
    if route.agent_id != agent_id:
        raise PermissionError("Not assigned to this route")
    if step.status != RouteStepStatus.PENDING:
        raise ValueError(f"Step already {step.status.value}")

    step.status = RouteStepStatus.DONE
    step.collected_at = datetime.now(timezone.utc).replace(tzinfo=None)

    # RM-06: inject fill=5 measurement (container now empty after collection)
    from app.schemas.iot import MeasurementIn
    from app.services.iot_ingest import ingest_measurement
    try:
        meas = MeasurementIn(
            container_id=step.container_id,
            fill_level=5,
            source="route_validation",
        )
        await ingest_measurement(meas, db)
    except Exception as exc:
        log.warning("RM-06 measurement injection failed for step %s: %s", step_id, exc)

    await db.commit()
    return await _step_to_out(step, db)


async def issue_step(
    step_id: uuid.UUID,
    agent_id: uuid.UUID,
    db: AsyncSession,
) -> RouteStepOut:
    step, route = await _get_step_and_route(step_id, db)
    if route.agent_id != agent_id:
        raise PermissionError("Not assigned to this route")
    if step.status != RouteStepStatus.PENDING:
        raise ValueError(f"Step already {step.status.value}")
    step.status = RouteStepStatus.ISSUE
    await db.commit()
    return await _step_to_out(step, db)


# ── private helpers ────────────────────────────────────────────────────────────

async def _get_step_and_route(
    step_id: uuid.UUID,
    db: AsyncSession,
) -> tuple[RouteStep, Route]:
    res = await db.execute(select(RouteStep).where(RouteStep.id == step_id))
    step = res.scalar_one_or_none()
    if step is None:
        raise ValueError("Step not found")
    route_res = await db.execute(select(Route).where(Route.id == step.route_id))
    route = route_res.scalar_one()
    if route.status != RouteStatus.IN_PROGRESS:
        raise ValueError(f"Route must be IN_PROGRESS, current: {route.status.value}")
    return step, route


async def _step_to_out(step: RouteStep, db: AsyncSession) -> RouteStepOut:
    row = (await db.execute(
        text("""
            SELECT c.qr_code,
                   ST_Y(c.geom::geometry) AS lat,
                   ST_X(c.geom::geometry) AS lng
            FROM containers c WHERE c.id = :cid
        """),
        {"cid": step.container_id},
    )).first()
    return RouteStepOut(
        id=step.id,
        step_order=step.step_order,
        container_id=step.container_id,
        qr_code=row.qr_code if row else "",
        lat=row.lat if row else 0.0,
        lng=row.lng if row else 0.0,
        status=step.status,
        collected_at=step.collected_at,
    )
