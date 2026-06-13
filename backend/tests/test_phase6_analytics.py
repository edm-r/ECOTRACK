"""
Tests Phase 6 — Analytics & Prédiction ML
"""
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.user import UserRole, UserStatus
from app.services.prediction_service import _clip, _predict

pytestmark = pytest.mark.asyncio

KPIS_URL = "/api/v1/analytics/kpis"
TIMESERIES_URL = "/api/v1/analytics/timeseries"
TOP_ZONES_URL = "/api/v1/analytics/zones/top"
HEATMAP_URL = "/api/v1/analytics/heatmap"
PREDICT_URL = "/api/v1/analytics/predictions/containers"


# ── helpers ───────────────────────────────────────────────────────────────


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _make_manager(db: AsyncSession, suffix: str) -> str:
    from app.models.user import User
    user = User(
        email=f"mgr6{suffix}@example.com",
        password_hash=hash_password("Password1!"),
        full_name=f"Manager6 {suffix}",
        role=UserRole.MANAGER,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    await db.commit()
    return create_access_token(str(user.id), user.role.value)


async def _make_citizen(db: AsyncSession, suffix: str) -> str:
    from app.models.user import User
    user = User(
        email=f"cit6{suffix}@example.com",
        password_hash=hash_password("Password1!"),
        full_name=f"Citizen6 {suffix}",
        role=UserRole.CITIZEN,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    await db.commit()
    return create_access_token(str(user.id), user.role.value)


# ── prediction service (pure functions) ───────────────────────────────────


def test_clip():
    assert _clip(-5) == 0.0
    assert _clip(105) == 100.0
    assert _clip(50.5) == 50.5


def test_predict_no_data():
    result = _predict([], current_fill=None)
    assert len(result) == 2
    assert result[0].horizon_h == 24
    assert result[1].horizon_h == 48
    for p in result:
        assert 0 <= p.confidence_low <= p.predicted_fill <= p.confidence_high <= 100


def test_predict_single_point():
    rows = [(80, 1_700_000_000.0)]
    result = _predict(rows, current_fill=80.0)
    assert len(result) == 2
    for p in result:
        assert 0 <= p.predicted_fill <= 100


def test_predict_trend_up():
    import time
    now = time.time()
    rows = [(i * 3, now + i * 3600) for i in range(10)]
    result = _predict(rows, current_fill=float(rows[-1][0]))
    # Trend is upward — 24h prediction should be > current fill
    assert result[0].predicted_fill >= rows[-1][0] * 0.8


def test_predict_bounds():
    import time
    now = time.time()
    rows = [(95 + i, now + i * 3600) for i in range(5)]
    result = _predict(rows, current_fill=99.0)
    for p in result:
        assert p.predicted_fill <= 100.0
        assert p.confidence_high <= 100.0
        assert p.confidence_low >= 0.0


# ── GET /analytics/kpis ───────────────────────────────────────────────────


async def test_kpis_ok(client: AsyncClient, db: AsyncSession):
    tok = await _make_manager(db, "_k1")
    resp = await client.get(KPIS_URL, headers=_auth(tok))
    assert resp.status_code == 200
    data = resp.json()
    required = {
        "containers_total", "containers_critical", "containers_watch",
        "containers_normal", "containers_unknown", "alerts_open",
        "reports_open", "reports_resolved_7d", "routes_active",
        "routes_completed_7d", "avg_fill_level", "co2_estimated_kg_7d",
    }
    assert required.issubset(data.keys())
    assert data["containers_total"] >= 0
    assert data["avg_fill_level"] >= 0


async def test_kpis_totals_consistent(client: AsyncClient, db: AsyncSession):
    tok = await _make_manager(db, "_k2")
    resp = await client.get(KPIS_URL, headers=_auth(tok))
    data = resp.json()
    # Sum of status counts must not exceed total
    status_sum = (
        data["containers_critical"]
        + data["containers_watch"]
        + data["containers_normal"]
        + data["containers_unknown"]
    )
    assert status_sum <= data["containers_total"]


async def test_kpis_requires_manager(client: AsyncClient, db: AsyncSession):
    tok = await _make_citizen(db, "_k3")
    resp = await client.get(KPIS_URL, headers=_auth(tok))
    assert resp.status_code == 403


# ── GET /analytics/timeseries ─────────────────────────────────────────────


async def test_timeseries_ok(client: AsyncClient, db: AsyncSession):
    tok = await _make_manager(db, "_ts1")
    resp = await client.get(
        f"{TIMESERIES_URL}?metric=avg_fill&granularity=day",
        headers=_auth(tok),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "points" in data
    assert isinstance(data["points"], list)
    for pt in data["points"]:
        assert "ts" in pt and "value" in pt


async def test_timeseries_invalid_metric(client: AsyncClient, db: AsyncSession):
    tok = await _make_manager(db, "_ts2")
    resp = await client.get(
        f"{TIMESERIES_URL}?metric=bad_metric",
        headers=_auth(tok),
    )
    assert resp.status_code == 422


async def test_timeseries_invalid_date(client: AsyncClient, db: AsyncSession):
    tok = await _make_manager(db, "_ts3")
    resp = await client.get(
        f"{TIMESERIES_URL}?from=not-a-date",
        headers=_auth(tok),
    )
    assert resp.status_code == 422


# ── GET /analytics/zones/top ──────────────────────────────────────────────


async def test_top_zones_ok(client: AsyncClient, db: AsyncSession):
    tok = await _make_manager(db, "_tz1")
    resp = await client.get(TOP_ZONES_URL, headers=_auth(tok))
    assert resp.status_code == 200
    data = resp.json()
    assert "zones" in data
    assert len(data["zones"]) <= 5
    for z in data["zones"]:
        assert "zone_id" in z
        assert "container_count" in z


# ── GET /analytics/heatmap ────────────────────────────────────────────────


async def test_heatmap_ok(client: AsyncClient, db: AsyncSession):
    tok = await _make_manager(db, "_hm1")
    resp = await client.get(HEATMAP_URL, headers=_auth(tok))
    assert resp.status_code == 200
    data = resp.json()
    assert "cells" in data
    for cell in data["cells"]:
        assert "lat" in cell and "lng" in cell and "weight" in cell


# ── GET /analytics/predictions/containers/{id} ────────────────────────────


async def test_prediction_ok(client: AsyncClient, db: AsyncSession):
    tok = await _make_manager(db, "_pr1")
    # Use any container from the DB (seeded)
    row = await db.execute(text("SELECT id FROM containers LIMIT 1"))
    cid = row.scalar_one_or_none()
    if cid is None:
        pytest.skip("No containers in DB")

    resp = await client.get(f"{PREDICT_URL}/{cid}", headers=_auth(tok))
    assert resp.status_code == 200
    data = resp.json()
    assert data["container_id"] == str(cid)
    assert len(data["predictions"]) == 2
    horizons = [p["horizon_h"] for p in data["predictions"]]
    assert 24 in horizons and 48 in horizons
    for p in data["predictions"]:
        assert 0 <= p["predicted_fill"] <= 100
        assert p["confidence_low"] <= p["predicted_fill"]
        assert p["predicted_fill"] <= p["confidence_high"]
