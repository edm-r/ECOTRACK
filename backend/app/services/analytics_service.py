import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.analytics import (
    HeatmapCell,
    HeatmapResponse,
    KpiDashboard,
    TimeseriesPoint,
    TimeseriesResponse,
    TopZone,
    TopZonesResponse,
)

_7D = "NOW() - INTERVAL '7 days'"


async def get_kpis(db: AsyncSession) -> KpiDashboard:
    cnt = (await db.execute(text("""
        SELECT
          COUNT(*)                                                  AS total,
          COUNT(*) FILTER (WHERE status = 'CRITICAL')              AS critical,
          COUNT(*) FILTER (WHERE status = 'WATCH')                 AS watch,
          COUNT(*) FILTER (WHERE status = 'NORMAL')                AS normal,
          COUNT(*) FILTER (WHERE status = 'UNKNOWN')               AS unknown,
          AVG(fill_level_latest) FILTER (WHERE fill_level_latest IS NOT NULL) AS avg_fill
        FROM containers
    """))).mappings().one()

    rep = (await db.execute(text(f"""
        SELECT
          COUNT(*) FILTER (WHERE status = 'OPEN')     AS open_cnt,
          COUNT(*) FILTER (WHERE status = 'RESOLVED'
                           AND created_at > {_7D})    AS resolved_7d
        FROM reports
    """))).mappings().one()

    rts = (await db.execute(text(f"""
        SELECT
          COUNT(*) FILTER (WHERE status = 'IN_PROGRESS')           AS active,
          COUNT(*) FILTER (WHERE status = 'DONE'
                           AND created_at > {_7D})                 AS done_7d,
          COALESCE(SUM(estimated_distance) FILTER (
              WHERE status = 'DONE' AND created_at > {_7D}
          ), 0)                                                     AS km_7d
        FROM routes
    """))).mappings().one()

    alerts_open = int(cnt["critical"]) + int(rep["open_cnt"])

    co2 = round(float(rts["km_7d"]) * 0.12, 2)

    return KpiDashboard(
        containers_total=int(cnt["total"]),
        containers_critical=int(cnt["critical"]),
        containers_watch=int(cnt["watch"]),
        containers_normal=int(cnt["normal"]),
        containers_unknown=int(cnt["unknown"]),
        alerts_open=alerts_open,
        reports_open=int(rep["open_cnt"]),
        reports_resolved_7d=int(rep["resolved_7d"]),
        routes_active=int(rts["active"]),
        routes_completed_7d=int(rts["done_7d"]),
        avg_fill_level=round(float(cnt["avg_fill"] or 0), 1),
        co2_estimated_kg_7d=co2,
    )


async def get_timeseries(
    db: AsyncSession,
    metric: str,
    zone_id: Optional[uuid.UUID],
    from_dt: datetime,
    to_dt: datetime,
    granularity: str,
) -> TimeseriesResponse:
    trunc = "day" if granularity == "day" else "hour"

    zone_filter = ""
    params: dict = {"from_dt": from_dt, "to_dt": to_dt}
    if zone_id:
        zone_filter = (
            "AND m.container_id IN "
            "(SELECT id FROM containers WHERE zone_id = :zone_id)"
        )
        params["zone_id"] = zone_id

    if metric == "report_count":
        sql = f"""
            SELECT DATE_TRUNC('{trunc}', r.created_at) AS ts,
                   COUNT(*)::float                      AS value
            FROM reports r
            JOIN containers c ON c.id = r.container_id
            WHERE r.created_at BETWEEN :from_dt AND :to_dt
              {('AND c.zone_id = :zone_id' if zone_id else '')}
            GROUP BY ts ORDER BY ts
        """
    else:
        # default: avg_fill
        sql = f"""
            SELECT DATE_TRUNC('{trunc}', m.measured_at) AS ts,
                   AVG(m.fill_level)                    AS value
            FROM iot_measurements m
            WHERE m.measured_at BETWEEN :from_dt AND :to_dt
              {zone_filter}
            GROUP BY ts ORDER BY ts
        """

    rows = (await db.execute(text(sql), params)).fetchall()
    return TimeseriesResponse(
        points=[
            TimeseriesPoint(ts=row[0], value=round(float(row[1]), 2))
            for row in rows
        ]
    )


async def get_top_zones(
    db: AsyncSession, limit: int = 5
) -> TopZonesResponse:
    rows = (await db.execute(
        text("""
            SELECT z.id, z.name,
                   COUNT(c.id)::int                                        AS cnt,
                   AVG(c.fill_level_latest) FILTER (WHERE c.fill_level_latest IS NOT NULL) AS avg_fill,
                   COUNT(c.id) FILTER (WHERE c.status = 'CRITICAL')::int   AS critical_cnt
            FROM zones z
            LEFT JOIN containers c ON c.zone_id = z.id
            GROUP BY z.id, z.name
            ORDER BY avg_fill DESC NULLS LAST
            LIMIT :lim
        """),
        {"lim": limit},
    )).mappings().fetchall()

    return TopZonesResponse(zones=[
        TopZone(
            zone_id=r["id"],
            zone_name=r["name"],
            container_count=r["cnt"],
            avg_fill_level=round(float(r["avg_fill"]), 1) if r["avg_fill"] else None,
            critical_count=r["critical_cnt"],
        )
        for r in rows
    ])


async def get_heatmap(
    db: AsyncSession,
    zone_id: Optional[uuid.UUID] = None,
    days: int = 30,
) -> HeatmapResponse:
    zone_filter = "AND c.zone_id = :zone_id" if zone_id else ""
    params: dict = {"since": datetime.now(timezone.utc) - timedelta(days=days)}
    if zone_id:
        params["zone_id"] = zone_id

    rows = (await db.execute(
        text(f"""
            SELECT
              ROUND(ST_Y(c.geom::geometry)::numeric, 2) AS lat,
              ROUND(ST_X(c.geom::geometry)::numeric, 2) AS lng,
              COUNT(*)::int                              AS weight
            FROM reports r
            JOIN containers c ON c.id = r.container_id
            WHERE r.created_at > :since
              {zone_filter}
            GROUP BY lat, lng
            ORDER BY weight DESC
        """),
        params,
    )).fetchall()

    return HeatmapResponse(cells=[
        HeatmapCell(lat=float(r[0]), lng=float(r[1]), weight=r[2])
        for r in rows
    ])
