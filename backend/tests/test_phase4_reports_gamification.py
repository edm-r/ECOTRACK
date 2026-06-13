"""
Tests Phase 4 — Signalements & Gamification
"""
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.user import UserRole, UserStatus

pytestmark = pytest.mark.asyncio

REPORTS_URL = "/api/v1/reports"
POINTS_URL = "/api/v1/users/me/points"


# ── helpers ───────────────────────────────────────────────────────────────────


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _make_user(db: AsyncSession, role: UserRole, suffix: str) -> tuple[str, str]:
    from app.models.user import User
    user = User(
        email=f"{role.value.lower()}4{suffix}@example.com",
        password_hash=hash_password("Password1!"),
        full_name=f"{role.value} {suffix}",
        role=role,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    await db.commit()
    token = create_access_token(str(user.id), user.role.value)
    return str(user.id), token


async def _create_container(db: AsyncSession, qr: str) -> str:
    cid = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO containers (id, qr_code, type, capacity_l, geom, status)
        VALUES (:id, :qr, 'GENERAL', 1000,
                ST_SetSRID(ST_MakePoint(2.34, 48.86), 4326), 'NORMAL')
        ON CONFLICT (qr_code) DO NOTHING
    """), {"id": cid, "qr": qr})
    await db.commit()
    return cid


# ── POST /reports ──────────────────────────────────────────────────────────────


async def test_create_report_citizen(client: AsyncClient, db: AsyncSession):
    _, token = await _make_user(db, UserRole.CITIZEN, "_r1")
    cid = await _create_container(db, f"RPT-{uuid.uuid4().hex[:6]}")

    resp = await client.post(REPORTS_URL, json={
        "container_id": cid,
        "type": "FULL",
        "comment": "Poubelle pleine",
    }, headers=_auth(token))
    assert resp.status_code == 201
    data = resp.json()
    assert data["container_id"] == cid
    assert data["type"] == "FULL"
    assert data["status"] == "OPEN"


async def test_create_report_agent(client: AsyncClient, db: AsyncSession):
    _, token = await _make_user(db, UserRole.AGENT, "_r2")
    cid = await _create_container(db, f"RPT-{uuid.uuid4().hex[:6]}")
    resp = await client.post(REPORTS_URL, json={
        "container_id": cid,
        "type": "DAMAGED",
    }, headers=_auth(token))
    assert resp.status_code == 201


async def test_create_report_manager_forbidden(client: AsyncClient, db: AsyncSession):
    _, token = await _make_user(db, UserRole.MANAGER, "_r3")
    cid = await _create_container(db, f"RPT-{uuid.uuid4().hex[:6]}")
    resp = await client.post(REPORTS_URL, json={
        "container_id": cid,
        "type": "FULL",
    }, headers=_auth(token))
    assert resp.status_code == 403


async def test_create_report_sets_container_critical(client: AsyncClient, db: AsyncSession):
    _, token = await _make_user(db, UserRole.CITIZEN, "_r4")
    cid = await _create_container(db, f"RPT-{uuid.uuid4().hex[:6]}")
    # Container starts NORMAL with no fill — open report → CRITICAL
    await client.post(REPORTS_URL, json={
        "container_id": cid,
        "type": "FULL",
    }, headers=_auth(token))
    row = await db.execute(
        text("SELECT status FROM containers WHERE id = :id"), {"id": cid}
    )
    assert row.scalar_one() == "CRITICAL"


async def test_create_report_awards_points(client: AsyncClient, db: AsyncSession):
    user_id, token = await _make_user(db, UserRole.CITIZEN, "_r5")
    cid = await _create_container(db, f"RPT-{uuid.uuid4().hex[:6]}")
    await client.post(REPORTS_URL, json={
        "container_id": cid,
        "type": "BLOCKED",
    }, headers=_auth(token))
    row = await db.execute(
        text("SELECT SUM(points) FROM points_events WHERE user_id = :uid"),
        {"uid": user_id},
    )
    total = row.scalar_one()
    assert total >= 10


# ── anti-doublon ───────────────────────────────────────────────────────────────


async def test_duplicate_report_409(client: AsyncClient, db: AsyncSession):
    _, token = await _make_user(db, UserRole.CITIZEN, "_dup1")
    cid = await _create_container(db, f"RPT-{uuid.uuid4().hex[:6]}")
    payload = {"container_id": cid, "type": "FULL"}

    resp1 = await client.post(REPORTS_URL, json=payload, headers=_auth(token))
    assert resp1.status_code == 201

    resp2 = await client.post(REPORTS_URL, json=payload, headers=_auth(token))
    assert resp2.status_code == 409
    body = resp2.json()
    assert body["detail"]["detail"] == "DUPLICATE_REPORT"
    assert "existing_id" in body["detail"]


async def test_different_users_no_duplicate(client: AsyncClient, db: AsyncSession):
    _, tok1 = await _make_user(db, UserRole.CITIZEN, "_dup2a")
    _, tok2 = await _make_user(db, UserRole.CITIZEN, "_dup2b")
    cid = await _create_container(db, f"RPT-{uuid.uuid4().hex[:6]}")
    payload = {"container_id": cid, "type": "FULL"}

    r1 = await client.post(REPORTS_URL, json=payload, headers=_auth(tok1))
    r2 = await client.post(REPORTS_URL, json=payload, headers=_auth(tok2))
    assert r1.status_code == 201
    assert r2.status_code == 201


# ── GET /reports ───────────────────────────────────────────────────────────────


async def test_list_reports_requires_manager(client: AsyncClient, db: AsyncSession):
    _, tok = await _make_user(db, UserRole.CITIZEN, "_lr1")
    resp = await client.get(REPORTS_URL, headers=_auth(tok))
    assert resp.status_code == 403


async def test_list_reports_manager_ok(client: AsyncClient, db: AsyncSession):
    _, m_tok = await _make_user(db, UserRole.MANAGER, "_lr2")
    resp = await client.get(REPORTS_URL, headers=_auth(m_tok))
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data and "total" in data


# ── GET /reports/mine ──────────────────────────────────────────────────────────


async def test_my_reports_citizen(client: AsyncClient, db: AsyncSession):
    user_id, tok = await _make_user(db, UserRole.CITIZEN, "_mine1")
    cid = await _create_container(db, f"RPT-{uuid.uuid4().hex[:6]}")
    await client.post(REPORTS_URL, json={"container_id": cid, "type": "OTHER"},
                      headers=_auth(tok))

    resp = await client.get(f"{REPORTS_URL}/mine", headers=_auth(tok))
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert all(str(r["user_id"]) == user_id for r in data["items"])


# ── PATCH /reports/{id}/status ─────────────────────────────────────────────────


async def test_confirm_report(client: AsyncClient, db: AsyncSession):
    _, cit_tok = await _make_user(db, UserRole.CITIZEN, "_st1")
    _, mgr_tok = await _make_user(db, UserRole.MANAGER, "_st1m")
    cid = await _create_container(db, f"RPT-{uuid.uuid4().hex[:6]}")

    r = await client.post(REPORTS_URL, json={"container_id": cid, "type": "FULL"},
                          headers=_auth(cit_tok))
    report_id = r.json()["id"]

    resp = await client.patch(
        f"{REPORTS_URL}/{report_id}/status",
        json={"status": "CONFIRMED"},
        headers=_auth(mgr_tok),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "CONFIRMED"


async def test_invalid_transition(client: AsyncClient, db: AsyncSession):
    _, cit_tok = await _make_user(db, UserRole.CITIZEN, "_st2")
    _, mgr_tok = await _make_user(db, UserRole.MANAGER, "_st2m")
    cid = await _create_container(db, f"RPT-{uuid.uuid4().hex[:6]}")

    r = await client.post(REPORTS_URL, json={"container_id": cid, "type": "FULL"},
                          headers=_auth(cit_tok))
    report_id = r.json()["id"]

    # OPEN → RESOLVED is invalid
    resp = await client.patch(
        f"{REPORTS_URL}/{report_id}/status",
        json={"status": "RESOLVED"},
        headers=_auth(mgr_tok),
    )
    assert resp.status_code == 422


async def test_confirm_awards_bonus_points(client: AsyncClient, db: AsyncSession):
    cit_id, cit_tok = await _make_user(db, UserRole.CITIZEN, "_st3")
    _, mgr_tok = await _make_user(db, UserRole.MANAGER, "_st3m")
    cid = await _create_container(db, f"RPT-{uuid.uuid4().hex[:6]}")

    r = await client.post(REPORTS_URL, json={"container_id": cid, "type": "FULL"},
                          headers=_auth(cit_tok))
    report_id = r.json()["id"]

    # Points before confirmation
    before = await db.execute(
        text("SELECT SUM(points) FROM points_events WHERE user_id = :uid"),
        {"uid": cit_id},
    )
    pts_before = before.scalar_one() or 0

    await client.patch(
        f"{REPORTS_URL}/{report_id}/status",
        json={"status": "CONFIRMED"},
        headers=_auth(mgr_tok),
    )

    after = await db.execute(
        text("SELECT SUM(points) FROM points_events WHERE user_id = :uid"),
        {"uid": cit_id},
    )
    pts_after = after.scalar_one() or 0
    assert pts_after > pts_before


async def test_change_status_requires_agent(client: AsyncClient, db: AsyncSession):
    _, cit_tok = await _make_user(db, UserRole.CITIZEN, "_st4")
    cid = await _create_container(db, f"RPT-{uuid.uuid4().hex[:6]}")
    r = await client.post(REPORTS_URL, json={"container_id": cid, "type": "FULL"},
                          headers=_auth(cit_tok))
    report_id = r.json()["id"]

    resp = await client.patch(
        f"{REPORTS_URL}/{report_id}/status",
        json={"status": "CONFIRMED"},
        headers=_auth(cit_tok),
    )
    assert resp.status_code == 403
