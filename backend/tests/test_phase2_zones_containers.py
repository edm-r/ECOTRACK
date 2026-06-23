"""
Tests Phase 2 — Zones & Conteneurs
"""
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import UserRole, UserStatus

pytestmark = pytest.mark.asyncio

REGISTER_URL = "/api/v1/auth/register"
LOGIN_URL = "/api/v1/auth/login"
ZONES_URL = "/api/v1/zones"
CONTAINERS_URL = "/api/v1/containers"
CONTAINERS_MAP_URL = "/api/v1/containers/map"

# GeoJSON polygon covering a small test area (Paris-ish, 0–2° E, 48–49° N)
TEST_POLYGON = {
    "type": "Polygon",
    "coordinates": [
        [
            [0.0, 48.0],
            [2.0, 48.0],
            [2.0, 49.0],
            [0.0, 49.0],
            [0.0, 48.0],
        ]
    ],
}

# A point inside the test polygon
INSIDE_LAT, INSIDE_LNG = 48.5, 1.0
# A point outside the test polygon
OUTSIDE_LAT, OUTSIDE_LNG = 51.0, 5.0


# ── fixtures ──────────────────────────────────────────────────────────────────


async def _get_token(client: AsyncClient, suffix: str) -> str:
    resp = await client.post(REGISTER_URL, json={
        "email": f"p2{suffix}@example.com",
        "password": "Password1!",
        "full_name": f"Phase2 User {suffix}",
    })
    assert resp.status_code == 201
    return resp.json()["access_token"]


async def _make_manager(db: AsyncSession, suffix: str) -> str:
    """Insert a MANAGER user directly in DB; return JWT via login."""
    from app.models.user import User
    from app.core.security import create_access_token
    manager = User(
        email=f"manager{suffix}@example.com",
        password_hash=hash_password("Password1!"),
        full_name=f"Manager {suffix}",
        role=UserRole.MANAGER,
        status=UserStatus.ACTIVE,
    )
    db.add(manager)
    await db.commit()
    return create_access_token(str(manager.id), manager.role.value)


async def _make_admin(db: AsyncSession, suffix: str) -> str:
    from app.models.user import User
    from app.core.security import create_access_token
    admin = User(
        email=f"admin{suffix}@example.com",
        password_hash=hash_password("Password1!"),
        full_name=f"Admin {suffix}",
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE,
    )
    db.add(admin)
    await db.commit()
    return create_access_token(str(admin.id), admin.role.value)


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _create_zone_via_sql(
    db: AsyncSession, name: str, priority: int = 1
) -> uuid.UUID:
    zone_id = uuid.uuid4()
    await db.execute(text("""
        INSERT INTO zones (id, name, priority, geom)
        VALUES (
            :id, :name, :priority,
            ST_SetSRID(
                ST_GeomFromText('POLYGON((0 48, 2 48, 2 49, 0 49, 0 48))'),
                4326
            )
        )
    """), {"id": str(zone_id), "name": name, "priority": priority})
    await db.commit()
    return zone_id


async def _create_container_via_sql(
    db: AsyncSession,
    qr: str,
    lat: float,
    lng: float,
    zone_id: uuid.UUID | None = None,
    status: str = "UNKNOWN",
    fill: int | None = None,
) -> uuid.UUID:
    cid = uuid.uuid4()
    await db.execute(text("""
        INSERT INTO containers
            (id, zone_id, qr_code, type, capacity_l, geom, status,
             fill_level_latest)
        VALUES (
            :id, :zone_id, :qr, 'GENERAL', 1000,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
            :status, :fill
        )
    """), {
        "id": str(cid),
        "zone_id": str(zone_id) if zone_id else None,
        "qr": qr,
        "lng": lng, "lat": lat,
        "status": status,
        "fill": fill,
    })
    await db.commit()
    return cid


# ── zones — auth ──────────────────────────────────────────────────────────────


async def test_get_zones_requires_auth(client: AsyncClient):
    resp = await client.get(ZONES_URL)
    assert resp.status_code in (401, 403)


async def test_get_zones_returns_list(
    client: AsyncClient, db: AsyncSession
):
    await _create_zone_via_sql(db, "Zone Test List")
    token = await _get_token(client, "_zlist")
    resp = await client.get(ZONES_URL, headers=_auth(token))
    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body, list)
    assert len(body) >= 1
    z = body[0]
    assert "id" in z
    assert "geom" in z
    assert z["geom"]["type"] == "Polygon"


async def test_create_zone_admin_only(
    client: AsyncClient, db: AsyncSession
):
    citizen_token = await _get_token(client, "_zadmin1")
    manager_token = await _make_manager(db, "_zadmin2")
    admin_token = await _make_admin(db, "_zadmin3")

    payload = {"name": "Nouvelle Zone", "priority": 2, "geom": TEST_POLYGON}

    resp = await client.post(
        ZONES_URL, json=payload, headers=_auth(citizen_token)
    )
    assert resp.status_code == 403

    resp = await client.post(
        ZONES_URL, json=payload, headers=_auth(manager_token)
    )
    assert resp.status_code == 403

    resp = await client.post(
        ZONES_URL, json=payload, headers=_auth(admin_token)
    )
    assert resp.status_code == 201
    z = resp.json()
    assert z["name"] == "Nouvelle Zone"
    assert z["priority"] == 2


async def test_update_zone_admin_only(
    client: AsyncClient, db: AsyncSession
):
    zone_id = await _create_zone_via_sql(db, "Zone Update Test")
    admin_token = await _make_admin(db, "_zupd1")
    citizen_token = await _get_token(client, "_zupd2")

    resp = await client.patch(
        f"{ZONES_URL}/{zone_id}",
        json={"priority": 5},
        headers=_auth(citizen_token),
    )
    assert resp.status_code == 403

    resp = await client.patch(
        f"{ZONES_URL}/{zone_id}",
        json={"priority": 5},
        headers=_auth(admin_token),
    )
    assert resp.status_code == 200
    assert resp.json()["priority"] == 5


async def test_get_zone_stats_manager_only(
    client: AsyncClient, db: AsyncSession
):
    zone_id = await _create_zone_via_sql(db, "Zone Stats Test")
    citizen_token = await _get_token(client, "_zstats1")
    manager_token = await _make_manager(db, "_zstats2")

    resp = await client.get(
        f"{ZONES_URL}/{zone_id}/stats",
        headers=_auth(citizen_token),
    )
    assert resp.status_code == 403

    resp = await client.get(
        f"{ZONES_URL}/{zone_id}/stats",
        headers=_auth(manager_token),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "container_count" in body
    assert "critical_count" in body
    assert "avg_fill_level" in body


# ── containers — map & list ───────────────────────────────────────────────────


async def test_get_containers_map_requires_auth(client: AsyncClient):
    resp = await client.get(CONTAINERS_MAP_URL)
    assert resp.status_code in (401, 403)


async def test_get_containers_map_returns_contract(
    client: AsyncClient, db: AsyncSession
):
    zone_id = await _create_zone_via_sql(db, "Zone Map Test")
    await _create_container_via_sql(
        db, "MAP-T001", INSIDE_LAT, INSIDE_LNG, zone_id
    )
    token = await _get_token(client, "_map1")
    resp = await client.get(
        CONTAINERS_MAP_URL, headers=_auth(token)
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body
    assert "total" in body
    assert body["total"] == len(body["items"])
    if body["items"]:
        item = body["items"][0]
        for field in (
            "id", "qr_code", "lat", "lng",
            "status", "fill_level", "zone_id", "zone_name",
        ):
            assert field in item, f"Missing field: {field}"


async def test_list_containers_pagination(
    client: AsyncClient, db: AsyncSession
):
    zone_id = await _create_zone_via_sql(db, "Zone Pagination Test")
    for i in range(3):
        await _create_container_via_sql(
            db, f"PAG-T{i:03d}", INSIDE_LAT, INSIDE_LNG + i * 0.01,
            zone_id,
        )
    token = await _get_token(client, "_pag1")
    resp = await client.get(
        CONTAINERS_URL,
        params={"limit": 2, "offset": 0},
        headers=_auth(token),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body
    assert "total" in body
    assert "limit" in body
    assert "offset" in body
    assert len(body["items"]) <= 2


async def test_list_containers_filter_by_status(
    client: AsyncClient, db: AsyncSession
):
    zone_id = await _create_zone_via_sql(db, "Zone Filter Test")
    await _create_container_via_sql(
        db, "FLT-CRIT001", INSIDE_LAT, INSIDE_LNG, zone_id,
        status="CRITICAL", fill=92,
    )
    await _create_container_via_sql(
        db, "FLT-NORM001", INSIDE_LAT, INSIDE_LNG + 0.01, zone_id,
        status="NORMAL", fill=30,
    )
    token = await _get_token(client, "_flt1")
    resp = await client.get(
        CONTAINERS_URL,
        params={"status": "CRITICAL"},
        headers=_auth(token),
    )
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert all(i["status"] == "CRITICAL" for i in items)


async def test_list_containers_filter_by_min_fill(
    client: AsyncClient, db: AsyncSession
):
    zone_id = await _create_zone_via_sql(db, "Zone Fill Test")
    await _create_container_via_sql(
        db, "FILL-HIGH001", INSIDE_LAT, INSIDE_LNG + 0.02, zone_id,
        fill=85,
    )
    await _create_container_via_sql(
        db, "FILL-LOW001", INSIDE_LAT, INSIDE_LNG + 0.03, zone_id,
        fill=20,
    )
    token = await _get_token(client, "_fill1")
    resp = await client.get(
        CONTAINERS_URL,
        params={"min_fill": 70},
        headers=_auth(token),
    )
    assert resp.status_code == 200
    items = resp.json()["items"]
    for item in items:
        if item["fill_level_latest"] is not None:
            assert item["fill_level_latest"] >= 70


# ── containers — CRUD ─────────────────────────────────────────────────────────


async def test_get_container_detail(
    client: AsyncClient, db: AsyncSession
):
    zone_id = await _create_zone_via_sql(db, "Zone Detail Test")
    cid = await _create_container_via_sql(
        db, "DTL-T001", INSIDE_LAT, INSIDE_LNG, zone_id
    )
    token = await _get_token(client, "_dtl1")
    resp = await client.get(
        f"{CONTAINERS_URL}/{cid}", headers=_auth(token)
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["qr_code"] == "DTL-T001"
    assert abs(body["lat"] - INSIDE_LAT) < 0.001
    assert abs(body["lng"] - INSIDE_LNG) < 0.001


async def test_create_container_citizen_forbidden(
    client: AsyncClient, db: AsyncSession
):
    citizen_token = await _get_token(client, "_create_cit")
    resp = await client.post(
        CONTAINERS_URL,
        json={
            "qr_code": "FORBIDDEN-001",
            "lat": INSIDE_LAT,
            "lng": INSIDE_LNG,
        },
        headers=_auth(citizen_token),
    )
    assert resp.status_code == 403


async def test_create_container_manager_ok_auto_zone(
    client: AsyncClient, db: AsyncSession
):
    await _create_zone_via_sql(db, "Zone AutoAssign Test")
    manager_token = await _make_manager(db, "_create_mgr")
    resp = await client.post(
        CONTAINERS_URL,
        json={
            "qr_code": "AUTO-ZONE-001",
            "lat": INSIDE_LAT,
            "lng": INSIDE_LNG,
        },
        headers=_auth(manager_token),
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["qr_code"] == "AUTO-ZONE-001"
    assert body["zone_id"] is not None  # auto-assigned


async def test_update_container_manager_ok(
    client: AsyncClient, db: AsyncSession
):
    zone_id = await _create_zone_via_sql(db, "Zone Update Container")
    cid = await _create_container_via_sql(
        db, "UPD-CNT001", INSIDE_LAT, INSIDE_LNG, zone_id
    )
    manager_token = await _make_manager(db, "_upd_cnt1")
    resp = await client.patch(
        f"{CONTAINERS_URL}/{cid}",
        json={"qr_code": "UPD-CNT001-NEW"},
        headers=_auth(manager_token),
    )
    assert resp.status_code == 200
    assert resp.json()["qr_code"] == "UPD-CNT001-NEW"


async def test_soft_delete_admin_only(
    client: AsyncClient, db: AsyncSession
):
    zone_id = await _create_zone_via_sql(db, "Zone Delete Test")
    cid = await _create_container_via_sql(
        db, "DEL-CNT001", INSIDE_LAT, INSIDE_LNG, zone_id
    )
    manager_token = await _make_manager(db, "_del_mgr1")
    admin_token = await _make_admin(db, "_del_adm1")

    resp = await client.delete(
        f"{CONTAINERS_URL}/{cid}", headers=_auth(manager_token)
    )
    assert resp.status_code == 403

    resp = await client.delete(
        f"{CONTAINERS_URL}/{cid}", headers=_auth(admin_token)
    )
    assert resp.status_code == 204

    # Verify soft-deleted = MAINTENANCE
    token = await _get_token(client, "_del_verify")
    resp = await client.get(
        f"{CONTAINERS_URL}/{cid}", headers=_auth(token)
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "MAINTENANCE"


async def test_measurements_requires_manager(
    client: AsyncClient, db: AsyncSession
):
    zone_id = await _create_zone_via_sql(db, "Zone Meas Test")
    cid = await _create_container_via_sql(
        db, "MEAS-CNT001", INSIDE_LAT, INSIDE_LNG, zone_id
    )
    citizen_token = await _get_token(client, "_meas_cit")
    manager_token = await _make_manager(db, "_meas_mgr")

    resp = await client.get(
        f"{CONTAINERS_URL}/{cid}/measurements",
        headers=_auth(citizen_token),
    )
    assert resp.status_code == 403

    resp = await client.get(
        f"{CONTAINERS_URL}/{cid}/measurements",
        headers=_auth(manager_token),
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_container_not_found(
    client: AsyncClient, db: AsyncSession
):
    token = await _get_token(client, "_notfound")
    fake_id = uuid.uuid4()
    resp = await client.get(
        f"{CONTAINERS_URL}/{fake_id}", headers=_auth(token)
    )
    assert resp.status_code == 404
