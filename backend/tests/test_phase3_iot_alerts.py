"""
Tests Phase 3 — IoT, Moteur de statut & Alertes
"""
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models.user import UserRole, UserStatus
from app.services.status_engine import compute_status
from app.models.container import ContainerStatus

pytestmark = pytest.mark.asyncio

IOT_URL = "/api/v1/iot/measurements"
ALERTS_URL = "/api/v1/alerts"

IOT_TOKEN = settings.IOT_SERVICE_TOKEN


# ── helpers ───────────────────────────────────────────────────────────────────


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _iot_headers() -> dict:
    return {"X-IoT-Token": IOT_TOKEN}


async def _make_manager(db: AsyncSession, suffix: str) -> str:
    from app.models.user import User
    manager = User(
        email=f"mgr3{suffix}@example.com",
        password_hash=hash_password("Password1!"),
        full_name=f"Manager3 {suffix}",
        role=UserRole.MANAGER,
        status=UserStatus.ACTIVE,
    )
    db.add(manager)
    await db.commit()
    return create_access_token(str(manager.id), manager.role.value)


async def _create_container(db: AsyncSession, qr: str, lat: float = 48.86, lng: float = 2.34) -> str:
    cid = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO containers (id, qr_code, type, capacity_l, geom, status)
        VALUES (:id, :qr, 'GENERAL', 1000,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), 'UNKNOWN')
    """), {"id": cid, "qr": qr, "lat": lat, "lng": lng})
    await db.commit()
    return cid


async def _set_status_critical(db: AsyncSession, container_id: str) -> None:
    await db.execute(text("""
        UPDATE containers
        SET status = 'CRITICAL', fill_level_latest = 95,
            last_measured_at = NOW()
        WHERE id = :id
    """), {"id": container_id})
    await db.commit()


# ── status engine (pure function) ─────────────────────────────────────────────


def test_compute_status_maintenance():
    assert compute_status(None, is_disabled=True) == ContainerStatus.MAINTENANCE
    assert compute_status(100, is_disabled=True) == ContainerStatus.MAINTENANCE


def test_compute_status_unknown():
    assert compute_status(None) == ContainerStatus.UNKNOWN


def test_compute_status_critical_fill():
    assert compute_status(90) == ContainerStatus.CRITICAL
    assert compute_status(100) == ContainerStatus.CRITICAL
    assert compute_status(91) == ContainerStatus.CRITICAL


def test_compute_status_critical_report():
    assert compute_status(50, recent_critical_report=True) == ContainerStatus.CRITICAL
    assert compute_status(0, recent_critical_report=True) == ContainerStatus.CRITICAL


def test_compute_status_watch():
    assert compute_status(70) == ContainerStatus.WATCH
    assert compute_status(89) == ContainerStatus.WATCH


def test_compute_status_normal():
    assert compute_status(0) == ContainerStatus.NORMAL
    assert compute_status(69) == ContainerStatus.NORMAL


# ── POST /iot/measurements ─────────────────────────────────────────────────────


async def test_iot_post_success(client: AsyncClient, db: AsyncSession):
    cid = await _create_container(db, f"IOT-CNT-{uuid.uuid4().hex[:6]}")
    resp = await client.post(IOT_URL, json={
        "container_id": cid,
        "fill_level": 55,
        "temperature": 22.5,
        "battery": 85,
    }, headers=_iot_headers())
    assert resp.status_code == 201
    data = resp.json()
    assert data["fill_level"] == 55
    assert data["container_id"] == cid
    assert data["source"] == "http"


async def test_iot_post_updates_status(client: AsyncClient, db: AsyncSession):
    cid = await _create_container(db, f"IOT-STS-{uuid.uuid4().hex[:6]}")
    resp = await client.post(IOT_URL, json={
        "container_id": cid,
        "fill_level": 92,
    }, headers=_iot_headers())
    assert resp.status_code == 201
    row = await db.execute(text("SELECT status FROM containers WHERE id = :id"), {"id": cid})
    assert row.scalar_one() == "CRITICAL"


async def test_iot_post_invalid_token(client: AsyncClient, db: AsyncSession):
    cid = await _create_container(db, f"IOT-TOK-{uuid.uuid4().hex[:6]}")
    resp = await client.post(IOT_URL, json={
        "container_id": cid,
        "fill_level": 50,
    }, headers={"X-IoT-Token": "wrong-token"})
    assert resp.status_code == 401


async def test_iot_post_missing_token(client: AsyncClient, db: AsyncSession):
    cid = await _create_container(db, f"IOT-NOTOK-{uuid.uuid4().hex[:6]}")
    resp = await client.post(IOT_URL, json={
        "container_id": cid,
        "fill_level": 50,
    })
    assert resp.status_code == 422


async def test_iot_post_invalid_fill_level(client: AsyncClient, db: AsyncSession):
    cid = await _create_container(db, f"IOT-FILL-{uuid.uuid4().hex[:6]}")
    resp = await client.post(IOT_URL, json={
        "container_id": cid,
        "fill_level": 150,
    }, headers=_iot_headers())
    assert resp.status_code == 422


async def test_iot_post_container_not_found(client: AsyncClient):
    resp = await client.post(IOT_URL, json={
        "container_id": str(uuid.uuid4()),
        "fill_level": 50,
    }, headers=_iot_headers())
    assert resp.status_code == 404


async def test_iot_post_future_timestamp(client: AsyncClient, db: AsyncSession):
    cid = await _create_container(db, f"IOT-FUT-{uuid.uuid4().hex[:6]}")
    future = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    resp = await client.post(IOT_URL, json={
        "container_id": cid,
        "fill_level": 50,
        "measured_at": future,
    }, headers=_iot_headers())
    assert resp.status_code == 422


async def test_iot_post_maintenance_rejected(client: AsyncClient, db: AsyncSession):
    cid = await _create_container(db, f"IOT-MAINT-{uuid.uuid4().hex[:6]}")
    await db.execute(text(
        "UPDATE containers SET status = 'MAINTENANCE' WHERE id = :id"
    ), {"id": cid})
    await db.commit()
    resp = await client.post(IOT_URL, json={
        "container_id": cid,
        "fill_level": 50,
    }, headers=_iot_headers())
    assert resp.status_code == 422


# ── GET /alerts ────────────────────────────────────────────────────────────────


async def test_alerts_requires_manager(client: AsyncClient, db: AsyncSession):
    from app.models.user import User
    citizen = User(
        email=f"cit3a{uuid.uuid4().hex[:4]}@example.com",
        password_hash=hash_password("Password1!"),
        full_name="Citizen3",
        role=UserRole.CITIZEN,
        status=UserStatus.ACTIVE,
    )
    db.add(citizen)
    await db.commit()
    token = create_access_token(str(citizen.id), citizen.role.value)
    resp = await client.get(ALERTS_URL, headers=_auth(token))
    assert resp.status_code == 403


async def test_alerts_returns_critical_containers(client: AsyncClient, db: AsyncSession):
    mgr_token = await _make_manager(db, "_alrt1")
    cid = await _create_container(db, f"ALRT-CNT-{uuid.uuid4().hex[:6]}")
    await _set_status_critical(db, cid)

    resp = await client.get(ALERTS_URL, headers=_auth(mgr_token))
    assert resp.status_code == 200
    alerts = resp.json()
    ids = [a["id"] for a in alerts]
    assert cid in ids

    alert = next(a for a in alerts if a["id"] == cid)
    assert alert["type"] == "CRITICAL_FILL"
    assert alert["container_id"] == cid
    assert alert["fill_level"] == 95
    assert alert["acknowledged"] is False


async def test_alerts_type_filter_critical(client: AsyncClient, db: AsyncSession):
    mgr_token = await _make_manager(db, "_alrt2")
    resp = await client.get(
        f"{ALERTS_URL}?type=CRITICAL_FILL", headers=_auth(mgr_token)
    )
    assert resp.status_code == 200
    for a in resp.json():
        assert a["type"] == "CRITICAL_FILL"


async def test_alerts_type_filter_open_report(client: AsyncClient, db: AsyncSession):
    mgr_token = await _make_manager(db, "_alrt3")
    resp = await client.get(
        f"{ALERTS_URL}?type=OPEN_REPORT", headers=_auth(mgr_token)
    )
    assert resp.status_code == 200
    for a in resp.json():
        assert a["type"] == "OPEN_REPORT"


async def test_alerts_type_filter_invalid(client: AsyncClient, db: AsyncSession):
    mgr_token = await _make_manager(db, "_alrt4")
    resp = await client.get(
        f"{ALERTS_URL}?type=UNKNOWN_TYPE", headers=_auth(mgr_token)
    )
    assert resp.status_code == 422


# ── POST /alerts/{id}/acknowledge ─────────────────────────────────────────────


async def test_acknowledge_critical_alert(client: AsyncClient, db: AsyncSession):
    mgr_token = await _make_manager(db, "_ack1")
    cid = await _create_container(db, f"ACK-CNT-{uuid.uuid4().hex[:6]}")
    await _set_status_critical(db, cid)

    resp = await client.post(
        f"{ALERTS_URL}/{cid}/acknowledge", headers=_auth(mgr_token)
    )
    assert resp.status_code == 204

    # Acknowledged flag should now be True
    resp = await client.get(ALERTS_URL, headers=_auth(mgr_token))
    alerts = resp.json()
    alert = next((a for a in alerts if a["id"] == cid), None)
    if alert:
        assert alert["acknowledged"] is True


async def test_acknowledge_not_found(client: AsyncClient, db: AsyncSession):
    mgr_token = await _make_manager(db, "_ack2")
    resp = await client.post(
        f"{ALERTS_URL}/{uuid.uuid4()}/acknowledge", headers=_auth(mgr_token)
    )
    assert resp.status_code == 404


async def test_acknowledge_requires_manager(client: AsyncClient, db: AsyncSession):
    from app.models.user import User
    citizen = User(
        email=f"cit3b{uuid.uuid4().hex[:4]}@example.com",
        password_hash=hash_password("Password1!"),
        full_name="Citizen3b",
        role=UserRole.CITIZEN,
        status=UserStatus.ACTIVE,
    )
    db.add(citizen)
    await db.commit()
    token = create_access_token(str(citizen.id), citizen.role.value)
    resp = await client.post(
        f"{ALERTS_URL}/{uuid.uuid4()}/acknowledge", headers=_auth(token)
    )
    assert resp.status_code == 403
