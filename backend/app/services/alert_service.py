import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.audit_service import log_event


async def list_alerts(
    db: AsyncSession,
    zone_id: Optional[uuid.UUID] = None,
    alert_type: Optional[str] = None,
) -> list[dict]:
    alerts: list[dict] = []

    if alert_type in (None, "CRITICAL_FILL"):
        q = """
            SELECT c.id, c.qr_code, c.fill_level_latest, c.last_measured_at,
                   z.name AS zone_name
            FROM containers c
            LEFT JOIN zones z ON z.id = c.zone_id
            WHERE c.status = 'CRITICAL'
              AND c.last_measured_at IS NOT NULL
        """
        params: dict = {}
        if zone_id:
            q += " AND c.zone_id = :zone_id"
            params["zone_id"] = zone_id

        rows = (await db.execute(text(q), params)).mappings().fetchall()
        ack_ids = await _acked_ids(db, [r["id"] for r in rows], "CRITICAL_FILL")

        for row in rows:
            alerts.append({
                "id": row["id"],
                "type": "CRITICAL_FILL",
                "container_id": row["id"],
                "container_qr": row["qr_code"],
                "zone_name": row["zone_name"] or "—",
                "fill_level": row["fill_level_latest"],
                "since": row["last_measured_at"],
                "acknowledged": str(row["id"]) in ack_ids,
            })

    if alert_type in (None, "OPEN_REPORT"):
        q = """
            SELECT r.id, r.container_id, r.created_at,
                   c.qr_code, c.fill_level_latest,
                   z.name AS zone_name
            FROM reports r
            JOIN containers c ON c.id = r.container_id
            LEFT JOIN zones z ON z.id = c.zone_id
            WHERE r.status = 'OPEN'
        """
        params = {}
        if zone_id:
            q += " AND c.zone_id = :zone_id"
            params["zone_id"] = zone_id

        rows = (await db.execute(text(q), params)).mappings().fetchall()
        ack_ids = await _acked_ids(db, [r["id"] for r in rows], "OPEN_REPORT")

        for row in rows:
            alerts.append({
                "id": row["id"],
                "type": "OPEN_REPORT",
                "container_id": row["container_id"],
                "container_qr": row["qr_code"],
                "zone_name": row["zone_name"] or "—",
                "fill_level": row["fill_level_latest"],
                "since": row["created_at"],
                "acknowledged": str(row["id"]) in ack_ids,
            })

    alerts.sort(key=lambda a: a["since"] or datetime.min, reverse=True)
    return alerts


async def _acked_ids(db: AsyncSession, ids: list, resource_type: str) -> set[str]:
    if not ids:
        return set()
    result = await db.execute(
        text("""
            SELECT DISTINCT resource_id::text FROM audit_logs
            WHERE action = 'ALERT_ACKNOWLEDGED'
              AND resource_type = :rtype
        """),
        {"rtype": resource_type},
    )
    all_acked = {row[0] for row in result.fetchall()}
    return {str(i) for i in ids} & all_acked


async def acknowledge_alert(
    alert_id: uuid.UUID,
    actor_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    row = await db.execute(
        text("SELECT 1 FROM containers WHERE id = :id AND status = 'CRITICAL'"),
        {"id": alert_id},
    )
    if row.first():
        resource_type = "CRITICAL_FILL"
    else:
        row = await db.execute(
            text("SELECT 1 FROM reports WHERE id = :id AND status = 'OPEN'"),
            {"id": alert_id},
        )
        if row.first():
            resource_type = "OPEN_REPORT"
        else:
            raise ValueError("Alert not found or already resolved")

    await log_event(
        action="ALERT_ACKNOWLEDGED",
        db=db,
        actor_id=actor_id,
        resource_type=resource_type,
        resource_id=alert_id,
        details={"alert_type": resource_type},
    )
