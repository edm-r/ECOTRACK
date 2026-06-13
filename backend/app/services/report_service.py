import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.container import Container, ContainerStatus
from app.models.report import Report, ReportStatus
from app.models.user import UserRole
from app.schemas.report import ReportIn, ReportOut, ReportStatusUpdate
from app.services.gamification_service import award_points
from app.services.status_engine import compute_status

log = logging.getLogger(__name__)


def _to_out(r: Report) -> ReportOut:
    return ReportOut(
        id=r.id,
        container_id=r.container_id,
        user_id=r.user_id,
        type=r.type,
        status=r.status,
        comment=r.comment,
        created_at=r.created_at,
    )


async def create_report(
    data: ReportIn,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> ReportOut:
    # Anti-doublon: same user + same container + OPEN within 60 min
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=60)).replace(tzinfo=None)
    dup = await db.execute(
        text("""
            SELECT id FROM reports
            WHERE user_id = :uid AND container_id = :cid
              AND status = 'OPEN' AND created_at > :cutoff
            LIMIT 1
        """),
        {"uid": user_id, "cid": data.container_id, "cutoff": cutoff},
    )
    dup_row = dup.first()
    if dup_row:
        raise DuplicateReportError(str(dup_row[0]))

    report = Report(
        user_id=user_id,
        container_id=data.container_id,
        type=data.type,
        comment=data.comment,
    )
    db.add(report)

    await _recompute_container_status(
        data.container_id, has_open_report=True, db=db
    )
    await award_points(user_id, "REPORT_CREATED", db, reason="Signalement créé")

    await db.commit()
    await db.refresh(report)
    return _to_out(report)


async def list_reports(
    db: AsyncSession,
    zone_id: Optional[uuid.UUID] = None,
    status: Optional[ReportStatus] = None,
    limit: int = 50,
    offset: int = 0,
) -> dict:
    where = ["1=1"]
    params: dict = {}
    if zone_id:
        where.append("c.zone_id = :zone_id")
        params["zone_id"] = zone_id
    if status:
        where.append("r.status = :status")
        params["status"] = status.value

    where_sql = " AND ".join(where)
    count_res = await db.execute(
        text(f"""
            SELECT COUNT(*) FROM reports r
            JOIN containers c ON c.id = r.container_id
            WHERE {where_sql}
        """),
        params,
    )
    total = count_res.scalar_one()

    rows = await db.execute(
        text(f"""
            SELECT r.id, r.container_id, r.user_id, r.type, r.status,
                   r.comment, r.created_at
            FROM reports r
            JOIN containers c ON c.id = r.container_id
            WHERE {where_sql}
            ORDER BY r.created_at DESC
            LIMIT :limit OFFSET :offset
        """),
        {**params, "limit": limit, "offset": offset},
    )
    items = [
        ReportOut(
            id=row.id,
            container_id=row.container_id,
            user_id=row.user_id,
            type=row.type,
            status=row.status,
            comment=row.comment,
            created_at=row.created_at,
        )
        for row in rows.fetchall()
    ]
    return {"items": items, "total": total, "limit": limit, "offset": offset}


async def list_my_reports(
    user_id: uuid.UUID,
    db: AsyncSession,
    limit: int = 50,
    offset: int = 0,
) -> dict:
    count_res = await db.execute(
        text("SELECT COUNT(*) FROM reports WHERE user_id = :uid"),
        {"uid": user_id},
    )
    total = count_res.scalar_one()

    rows = await db.execute(
        text("""
            SELECT id, container_id, user_id, type, status, comment, created_at
            FROM reports WHERE user_id = :uid
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """),
        {"uid": user_id, "limit": limit, "offset": offset},
    )
    items = [
        ReportOut(
            id=r.id,
            container_id=r.container_id,
            user_id=r.user_id,
            type=r.type,
            status=r.status,
            comment=r.comment,
            created_at=r.created_at,
        )
        for r in rows.fetchall()
    ]
    return {"items": items, "total": total, "limit": limit, "offset": offset}


_VALID_TRANSITIONS: dict[ReportStatus, set[ReportStatus]] = {
    ReportStatus.OPEN: {ReportStatus.CONFIRMED, ReportStatus.REJECTED},
    ReportStatus.CONFIRMED: {ReportStatus.RESOLVED, ReportStatus.REJECTED},
}


async def change_status(
    report_id: uuid.UUID,
    payload: ReportStatusUpdate,
    actor_role: UserRole,
    db: AsyncSession,
) -> ReportOut:
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if report is None:
        raise ValueError("Report not found")

    allowed = _VALID_TRANSITIONS.get(report.status, set())
    if payload.status not in allowed:
        raise ValueError(
            f"Transition {report.status.value} → {payload.status.value} non autorisée"
        )

    old_status = report.status
    report.status = payload.status
    container_id = report.container_id

    # Bonus points when confirmed
    if payload.status == ReportStatus.CONFIRMED:
        await award_points(
            report.user_id, "REPORT_CONFIRMED", db, reason="Signalement confirmé"
        )

    await db.flush()

    # Re-evaluate container: check remaining OPEN reports
    remaining = await db.execute(
        text("""
            SELECT 1 FROM reports
            WHERE container_id = :cid AND status = 'OPEN' LIMIT 1
        """),
        {"cid": container_id},
    )
    has_open = remaining.first() is not None
    await _recompute_container_status(container_id, has_open_report=has_open, db=db)

    await db.commit()
    await db.refresh(report)

    log.info("report %s: %s → %s", report.id, old_status.value, payload.status.value)
    return _to_out(report)


async def _recompute_container_status(
    container_id: uuid.UUID,
    has_open_report: bool,
    db: AsyncSession,
) -> None:
    result = await db.execute(
        select(Container).where(Container.id == container_id)
    )
    container = result.scalar_one_or_none()
    if container is None or container.status == ContainerStatus.MAINTENANCE:
        return
    new_status = compute_status(
        latest_fill=container.fill_level_latest,
        recent_critical_report=has_open_report,
        is_disabled=False,
    )
    container.status = new_status


class DuplicateReportError(Exception):
    def __init__(self, existing_id: str) -> None:
        self.existing_id = existing_id
        super().__init__(f"Duplicate report: {existing_id}")
