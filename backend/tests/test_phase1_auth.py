"""
Tests Phase 1 — Auth + RBAC + JWT
"""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

REGISTER_URL = "/api/v1/auth/register"
LOGIN_URL = "/api/v1/auth/login"
ME_URL = "/api/v1/auth/me"
USERS_ME_URL = "/api/v1/users/me"
USERS_ME_POINTS_URL = "/api/v1/users/me/points"


# ── helpers ───────────────────────────────────────────────────────────────────

async def _register(client: AsyncClient, suffix: str = "") -> dict:
    resp = await client.post(REGISTER_URL, json={
        "email": f"test{suffix}@example.com",
        "password": "Password1!",
        "full_name": f"Test User{suffix}",
    })
    assert resp.status_code == 201, resp.text
    return resp.json()


async def _login(client: AsyncClient, email: str, password: str) -> dict:
    resp = await client.post(LOGIN_URL, json={
        "email": email,
        "password": password,
    })
    return resp.json()


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── register ──────────────────────────────────────────────────────────────────

async def test_register_success(client: AsyncClient):
    data = await _register(client, suffix="_reg1")
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "test_reg1@example.com"
    assert data["user"]["role"] == "CITIZEN"


async def test_register_role_forced_citizen(client: AsyncClient):
    data = await _register(client, suffix="_reg2")
    assert data["user"]["role"] == "CITIZEN"


async def test_register_duplicate_email(client: AsyncClient):
    await _register(client, suffix="_dup")
    resp = await client.post(REGISTER_URL, json={
        "email": "test_dup@example.com",
        "password": "Password1!",
        "full_name": "Dup User",
    })
    assert resp.status_code == 409


async def test_register_weak_password(client: AsyncClient):
    resp = await client.post(REGISTER_URL, json={
        "email": "weak@example.com",
        "password": "short",
        "full_name": "Weak User",
    })
    assert resp.status_code == 422


# ── login ─────────────────────────────────────────────────────────────────────

async def test_login_success(client: AsyncClient):
    await _register(client, suffix="_log1")
    data = await _login(client, "test_log1@example.com", "Password1!")
    assert "access_token" in data
    assert data["user"]["role"] == "CITIZEN"


async def test_login_wrong_password(client: AsyncClient):
    await _register(client, suffix="_log2")
    resp = await client.post(LOGIN_URL, json={
        "email": "test_log2@example.com",
        "password": "WrongPass1!",
    })
    assert resp.status_code == 401


async def test_login_unknown_email(client: AsyncClient):
    resp = await client.post(LOGIN_URL, json={
        "email": "nobody@example.com",
        "password": "Password1!",
    })
    assert resp.status_code == 401


# ── /me endpoints ─────────────────────────────────────────────────────────────

async def test_auth_me(client: AsyncClient):
    data = await _register(client, suffix="_me1")
    token = data["access_token"]
    resp = await client.get(ME_URL, headers=_auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["email"] == "test_me1@example.com"


async def test_users_me(client: AsyncClient):
    data = await _register(client, suffix="_me2")
    token = data["access_token"]
    resp = await client.get(USERS_ME_URL, headers=_auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["role"] == "CITIZEN"


async def test_users_me_points_empty(client: AsyncClient):
    data = await _register(client, suffix="_pts1")
    token = data["access_token"]
    resp = await client.get(USERS_ME_POINTS_URL, headers=_auth_headers(token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_points"] == 0
    assert body["events"] == []


async def test_users_me_patch_full_name(client: AsyncClient):
    data = await _register(client, suffix="_patch1")
    token = data["access_token"]
    resp = await client.patch(
        USERS_ME_URL,
        json={"full_name": "Nouveau Nom"},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Nouveau Nom"


async def test_users_me_patch_weak_password(client: AsyncClient):
    data = await _register(client, suffix="_patch2")
    token = data["access_token"]
    resp = await client.patch(
        USERS_ME_URL,
        json={"password": "abc"},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 422


# ── auth guards ───────────────────────────────────────────────────────────────

async def test_no_token_returns_403_or_401(client: AsyncClient):
    resp = await client.get(USERS_ME_URL)
    assert resp.status_code in (401, 403)


async def test_invalid_token_returns_401(client: AsyncClient):
    resp = await client.get(
        USERS_ME_URL,
        headers={"Authorization": "Bearer not.a.valid.token"},
    )
    assert resp.status_code == 401


async def test_expired_token_returns_401(client: AsyncClient):
    from datetime import datetime, timedelta, timezone
    from jose import jwt
    from app.core.config import settings

    payload = {
        "sub": "00000000-0000-0000-0000-000000000001",
        "role": "CITIZEN",
        "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
    }
    expired_token = jwt.encode(
        payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    resp = await client.get(
        USERS_ME_URL,
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert resp.status_code == 401
