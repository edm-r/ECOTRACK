# ─────────────────────────────────────────────────────────────────────────────
# Running the backend tests locally:
#   1. Start the compose Postgres (exposed on localhost:5433):
#        docker compose up -d postgres
#   2. From backend/ run:
#        .venv/bin/python -m pytest tests/ -q
#
# The root .env points POSTGRES_HOST at the Docker network name ("postgres"),
# which is unresolvable outside containers. We load backend/.env.test FIRST
# (with override=True) so pytest talks to localhost:5433. pydantic-settings
# reads os.environ with higher priority than the .env file, so this override
# wins even though app.core.config still declares env_file=.env.
# ─────────────────────────────────────────────────────────────────────────────
import os
from pathlib import Path

from dotenv import load_dotenv

# MUST run before any `app.*` import (Settings() runs at import time).
load_dotenv(Path(__file__).resolve().parents[1] / ".env.test", override=True)
os.environ.setdefault("POSTGRES_HOST", "localhost")
os.environ.setdefault("POSTGRES_PORT", "5433")

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.main import app


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c


@pytest_asyncio.fixture
async def db():
    async with AsyncSessionLocal() as session:
        yield session
