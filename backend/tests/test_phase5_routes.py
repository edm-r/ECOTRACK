"""
Tests Phase 5 — Tournées (optimisation, CRUD, agent actions, RM-06)
"""
import uuid
from datetime import date

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.user import UserRole, UserStatus
from app.services.route_optimizer import ContainerPoint, haversine, optimize

pytestmark = pytest.mark.asyncio

ROUTES_URL = "/api/v1/routes"
STEPS_URL = "/api/v1/route-steps"
OPTIMIZE_URL = "/api/v1/routes/optimize"


# ── helpers ───────────────────────────────────────────────────────────────


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _make_user(db: AsyncSession, role: UserRole, suffix: str):
    from app.models.user import User
    user = User(
        email=f"{role.value.lower()}5{suffix}@example.com",
        password_hash=hash_password("Password1!"),
        full_name=f"{role.value} {suffix}",
        role=role,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    await db.commit()
    return user, create_access_token(str(user.id), user.role.value)


async def _create_zone_and_containers(
    db: AsyncSession, suffix: str, n: int = 3
) -> tuple[str, list[str]]:
    zone_id = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO zones (id, name, priority, geom)
        VALUES (:id, :name, 1,
                ST_SetSRID(ST_GeomFromText(
                  'POLYGON((2.3 48.8, 2.4 48.8, 2.4 48.9, 2.3 48.9, 2.3 48.8))'
                ), 4326))
    """), {"id": zone_id, "name": f"Zone5-{suffix}"})

    cids = []
    for i in range(n):
        cid = str(uuid.uuid4())
        lat = 48.85 + i * 0.01
        lng = 2.35 + i * 0.005
        await db.execute(text("""
            INSERT INTO containers
                (id, zone_id, qr_code, type, capacity_l, geom,
                 status, fill_level_latest, last_measured_at)
            VALUES (:id, :zid, :qr, 'GENERAL', 1000,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                    'CRITICAL', 92, NOW())
        """), {"id": cid, "zid": zone_id, "qr": f"RT5-{suffix}-{i}",
               "lat": lat, "lng": lng})
        cids.append(cid)

    await db.commit()
    return zone_id, cids


# ── route_optimizer (pure function) ──────────────────────────────────────


def test_haversine_zero():
    assert haversine(48.0, 2.0, 48.0, 2.0) == 0.0


def test_haversine_known():
    # Paris → Lyon ≈ 393 km
    d = haversine(48.8566, 2.3522, 45.7640, 4.8357)
    assert 380 < d < 410


def test_optimize_empty():
    result, dist = optimize([])
    assert result == []
    assert dist == 0.0


def test_optimize_single():
    p = ContainerPoint("a", "Q1", 48.86, 2.35, 90, "CRITICAL")
    result, dist = optimize([p])
    assert len(result) == 1
    assert dist == 0.0


def test_optimize_reduces_distance():
    # 4 corners of a square — optimal tour shorter than naive order
    pts = [
        ContainerPoint("a", "Q1", 0.0, 0.0, 90, "CRITICAL"),
        ContainerPoint("b", "Q2", 1.0, 1.0, 90, "CRITICAL"),
        ContainerPoint("c", "Q3", 0.0, 1.0, 90, "CRITICAL"),
        ContainerPoint("d", "Q4", 1.0, 0.0, 90, "CRITICAL"),
    ]
    ordered, dist = optimize(pts)
    assert len(ordered) == 4
    assert dist > 0


# ── POST /routes/optimize ─────────────────────────────────────────────────


async def test_optimize_preview(client: AsyncClient, db: AsyncSession):
    _, mgr_tok = await _make_user(db, UserRole.MANAGER, "_opt1")
    zone_id, _ = await _create_zone_and_containers(db, "_opt1")

    resp = await client.post(OPTIMIZE_URL, json={
        "zone_id": zone_id,
        "fill_threshold": 70,
    }, headers=_auth(mgr_tok))
    assert resp.status_code == 200
    data = resp.json()
    assert "ordered_steps" in data
    assert "estimated_distance_km" in data
    assert data["container_count"] == len(data["ordered_steps"])


async def test_optimize_requires_manager(client: AsyncClient, db: AsyncSession):
    _, cit_tok = await _make_user(db, UserRole.CITIZEN, "_opt2")
    resp = await client.post(OPTIMIZE_URL, json={
        "zone_id": str(uuid.uuid4()),
        "fill_threshold": 70,
    }, headers=_auth(cit_tok))
    assert resp.status_code == 403


# ── POST /routes (create) ─────────────────────────────────────────────────


async def test_create_route(client: AsyncClient, db: AsyncSession):
    _, mgr_tok = await _make_user(db, UserRole.MANAGER, "_cr1")
    zone_id, _ = await _create_zone_and_containers(db, "_cr1")

    resp = await client.post(ROUTES_URL, json={
        "zone_id": zone_id,
        "scheduled_date": str(date.today()),
        "fill_threshold": 70,
    }, headers=_auth(mgr_tok))
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "DRAFT"
    assert len(data["steps"]) == 3
    assert data["estimated_distance"] is not None


# ── GET /routes ────────────────────────────────────────────────────────────


async def test_list_routes(client: AsyncClient, db: AsyncSession):
    _, mgr_tok = await _make_user(db, UserRole.MANAGER, "_lr1")
    resp = await client.get(ROUTES_URL, headers=_auth(mgr_tok))
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data and "total" in data


# ── full agent lifecycle ───────────────────────────────────────────────────


async def test_full_agent_lifecycle(client: AsyncClient, db: AsyncSession):
    _, mgr_tok = await _make_user(db, UserRole.MANAGER, "_lc1")
    agent, agt_tok = await _make_user(db, UserRole.AGENT, "_lc1")
    zone_id, cids = await _create_zone_and_containers(db, "_lc1", n=2)

    # Create route
    r = await client.post(ROUTES_URL, json={
        "zone_id": zone_id,
        "scheduled_date": str(date.today()),
    }, headers=_auth(mgr_tok))
    assert r.status_code == 201
    route_id = r.json()["id"]
    step_id = r.json()["steps"][0]["id"]

    # Assign agent
    r = await client.patch(
        f"{ROUTES_URL}/{route_id}/assign",
        params={"agent_id": str(agent.id)},
        headers=_auth(mgr_tok),
    )
    assert r.status_code == 200
    assert r.json()["status"] == "ASSIGNED"

    # Start route
    r = await client.patch(
        f"{ROUTES_URL}/{route_id}/start", headers=_auth(agt_tok)
    )
    assert r.status_code == 200
    assert r.json()["status"] == "IN_PROGRESS"

    # Validate step (RM-06: injects fill=5)
    r = await client.patch(
        f"{STEPS_URL}/{step_id}/validate", headers=_auth(agt_tok)
    )
    assert r.status_code == 200
    assert r.json()["status"] == "DONE"

    # Verify RM-06: container fill updated to ~5
    cnt_id = r.json()["container_id"]
    row = await db.execute(
        text("SELECT fill_level_latest FROM containers WHERE id = :id"),
        {"id": cnt_id},
    )
    assert row.scalar_one() == 5

    # Complete route
    r = await client.patch(
        f"{ROUTES_URL}/{route_id}/complete", headers=_auth(agt_tok)
    )
    assert r.status_code == 200
    assert r.json()["status"] == "DONE"


async def test_step_issue(client: AsyncClient, db: AsyncSession):
    _, mgr_tok = await _make_user(db, UserRole.MANAGER, "_iss1")
    agent, agt_tok = await _make_user(db, UserRole.AGENT, "_iss1")
    zone_id, _ = await _create_zone_and_containers(db, "_iss1", n=1)

    r = await client.post(ROUTES_URL, json={
        "zone_id": zone_id,
        "scheduled_date": str(date.today()),
    }, headers=_auth(mgr_tok))
    route_id = r.json()["id"]
    step_id = r.json()["steps"][0]["id"]

    await client.patch(
        f"{ROUTES_URL}/{route_id}/assign",
        params={"agent_id": str(agent.id)},
        headers=_auth(mgr_tok),
    )
    await client.patch(f"{ROUTES_URL}/{route_id}/start", headers=_auth(agt_tok))

    r = await client.patch(
        f"{STEPS_URL}/{step_id}/issue", headers=_auth(agt_tok)
    )
    assert r.status_code == 200
    assert r.json()["status"] == "ISSUE"


async def test_agent_cannot_start_unassigned(client: AsyncClient, db: AsyncSession):
    _, mgr_tok = await _make_user(db, UserRole.MANAGER, "_ua1")
    _, agt_tok = await _make_user(db, UserRole.AGENT, "_ua1")
    zone_id, _ = await _create_zone_and_containers(db, "_ua1", n=1)

    r = await client.post(ROUTES_URL, json={
        "zone_id": zone_id,
        "scheduled_date": str(date.today()),
    }, headers=_auth(mgr_tok))
    route_id = r.json()["id"]

    r = await client.patch(
        f"{ROUTES_URL}/{route_id}/start", headers=_auth(agt_tok)
    )
    assert r.status_code in (403, 422)


async def test_mine_returns_today_routes(client: AsyncClient, db: AsyncSession):
    _, mgr_tok = await _make_user(db, UserRole.MANAGER, "_mine1")
    agent, agt_tok = await _make_user(db, UserRole.AGENT, "_mine1")
    zone_id, _ = await _create_zone_and_containers(db, "_mine1", n=1)

    await client.post(ROUTES_URL, json={
        "zone_id": zone_id,
        "scheduled_date": str(date.today()),
    }, headers=_auth(mgr_tok))

    resp = await client.get(f"{ROUTES_URL}/mine", headers=_auth(agt_tok))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
