"""
Tests Phase 7 — Admin, Exports, Hardening
"""
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.user import UserRole, UserStatus

pytestmark = pytest.mark.asyncio

USERS_URL = "/api/v1/users"
AUDIT_URL = "/api/v1/audit-logs"
EXPORT_URL = "/api/v1/analytics/reports/export"


# ── helpers ───────────────────────────────────────────────────────────────


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _make_user(
    db: AsyncSession,
    suffix: str,
    role: UserRole = UserRole.CITIZEN,
) -> tuple:
    from app.models.user import User

    user = User(
        email=f"u7{suffix}@example.com",
        password_hash=hash_password("Password1!"),
        full_name=f"User7 {suffix}",
        role=role,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    await db.commit()
    token = create_access_token(str(user.id), user.role.value)
    return user, token


# ── GET /users (ADMIN only) ───────────────────────────────────────────────


async def test_list_users_as_admin(client: AsyncClient, db: AsyncSession):
    _, tok = await _make_user(db, "_lu1", UserRole.ADMIN)
    resp = await client.get(USERS_URL, headers=_auth(tok))
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data and "total" in data
    assert data["total"] >= 1


async def test_list_users_manager_forbidden(
    client: AsyncClient, db: AsyncSession
):
    _, tok = await _make_user(db, "_lu2", UserRole.MANAGER)
    resp = await client.get(USERS_URL, headers=_auth(tok))
    assert resp.status_code == 403


async def test_list_users_search(client: AsyncClient, db: AsyncSession):
    _, tok = await _make_user(db, "_lu3", UserRole.ADMIN)
    resp = await client.get(
        f"{USERS_URL}?search=u7_lu3", headers=_auth(tok)
    )
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


# ── POST /users (ADMIN only) ──────────────────────────────────────────────


async def test_create_user_admin(client: AsyncClient, db: AsyncSession):
    _, tok = await _make_user(db, "_cu1", UserRole.ADMIN)
    payload = {
        "email": "newagent7@example.com",
        "password": "Password1!",
        "full_name": "New Agent",
        "role": "AGENT",
    }
    resp = await client.post(USERS_URL, json=payload, headers=_auth(tok))
    assert resp.status_code == 201
    data = resp.json()
    assert data["role"] == "AGENT"
    assert data["email"] == "newagent7@example.com"


async def test_create_user_duplicate_email(
    client: AsyncClient, db: AsyncSession
):
    _, tok = await _make_user(db, "_cu2", UserRole.ADMIN)
    payload = {
        "email": "u7_cu2@example.com",
        "password": "Password1!",
        "full_name": "Dup User",
        "role": "CITIZEN",
    }
    resp = await client.post(USERS_URL, json=payload, headers=_auth(tok))
    assert resp.status_code == 409


# ── PATCH /users/{id} (ADMIN only) ───────────────────────────────────────


async def test_update_user_role(client: AsyncClient, db: AsyncSession):
    target, _ = await _make_user(db, "_uu1", UserRole.CITIZEN)
    _, tok = await _make_user(db, "_uu1adm", UserRole.ADMIN)
    resp = await client.patch(
        f"{USERS_URL}/{target.id}",
        json={"role": "AGENT"},
        headers=_auth(tok),
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "AGENT"


# ── DELETE /users/{id} (ADMIN only) ──────────────────────────────────────


async def test_deactivate_user(client: AsyncClient, db: AsyncSession):
    target, _ = await _make_user(db, "_du1", UserRole.CITIZEN)
    admin, tok = await _make_user(db, "_du1adm", UserRole.ADMIN)
    resp = await client.delete(
        f"{USERS_URL}/{target.id}", headers=_auth(tok)
    )
    assert resp.status_code == 204


async def test_deactivate_self_forbidden(
    client: AsyncClient, db: AsyncSession
):
    admin, tok = await _make_user(db, "_ds1", UserRole.ADMIN)
    resp = await client.delete(
        f"{USERS_URL}/{admin.id}", headers=_auth(tok)
    )
    assert resp.status_code == 409


# ── GET /audit-logs (ADMIN only) ─────────────────────────────────────────


async def test_audit_logs_ok(client: AsyncClient, db: AsyncSession):
    _, tok = await _make_user(db, "_al1", UserRole.ADMIN)
    resp = await client.get(AUDIT_URL, headers=_auth(tok))
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data and "total" in data
    for entry in data["items"]:
        assert "action" in entry and "created_at" in entry


async def test_audit_logs_manager_forbidden(
    client: AsyncClient, db: AsyncSession
):
    _, tok = await _make_user(db, "_al2", UserRole.MANAGER)
    resp = await client.get(AUDIT_URL, headers=_auth(tok))
    assert resp.status_code == 403


# ── POST /analytics/reports/export ───────────────────────────────────────


async def test_export_csv_ok(client: AsyncClient, db: AsyncSession):
    _, tok = await _make_user(db, "_ex1", UserRole.MANAGER)
    resp = await client.post(
        EXPORT_URL, json={"format": "csv"}, headers=_auth(tok)
    )
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    assert "attachment" in resp.headers.get("content-disposition", "")


async def test_export_citizen_forbidden(
    client: AsyncClient, db: AsyncSession
):
    _, tok = await _make_user(db, "_ex2", UserRole.CITIZEN)
    resp = await client.post(
        EXPORT_URL, json={"format": "csv"}, headers=_auth(tok)
    )
    assert resp.status_code == 403


# ── Security headers ──────────────────────────────────────────────────────


async def test_security_headers(client: AsyncClient, db: AsyncSession):
    resp = await client.get("/health")
    assert resp.headers.get("x-content-type-options") == "nosniff"
    assert resp.headers.get("x-frame-options") == "DENY"
    assert resp.headers.get("x-xss-protection") == "1; mode=block"
